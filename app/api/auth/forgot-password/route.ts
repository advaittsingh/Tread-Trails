import { NextResponse } from "next/server";
import { Resend } from "resend";

import {
  generatePasswordResetRawToken,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset-token";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { forgotPasswordRequestSchema } from "@/lib/validations/forgot-password";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const RESET_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = forgotPasswordRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;

      if (!apiKey || !from) {
        console.error(
          "[forgot-password] RESEND_API_KEY / RESEND_FROM_EMAIL missing — cannot send reset email"
        );
      } else {
        await prisma.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null },
        });

        const raw = generatePasswordResetRawToken();
        const tokenHash = hashPasswordResetToken(raw);
        const expiresAt = new Date(Date.now() + RESET_TTL_MS);

        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });

        const resetUrl = `${absoluteUrl("/reset-password")}?token=${encodeURIComponent(raw)}`;
        const safeName = escapeHtml(user.name.split(/\s+/)[0] ?? "there");

        const html = `
          <p>Hi ${safeName},</p>
          <p>We received a request to reset your password for <strong>${escapeHtml(user.email)}</strong>.</p>
          <p><a href="${escapeHtml(resetUrl)}">Choose a new password</a></p>
          <p style="color:#555;font-size:13px;">This link expires in 24 hours. If you didn&apos;t ask for this, you can ignore this email.</p>
          <p style="color:#555;font-size:12px;word-break:break-all;">${escapeHtml(resetUrl)}</p>
          <p>— Tread Trails</p>
        `.trim();

        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from,
          to: [user.email],
          subject: "Reset your Tread Trails password",
          html,
        });

        if (error) {
          console.error("[forgot-password] Resend error:", error);
        }
      }
    }
  } catch (e) {
    console.error("[forgot-password]", e);
  }

  return NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email, we sent reset instructions. Check your inbox and spam folder.",
  });
}
