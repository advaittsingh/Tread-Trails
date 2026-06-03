import { Resend } from "resend";

import type { ApiUser } from "@tread-trails/shared-types";

import { env } from "../config/env.js";
import { loginFailureResponse } from "../lib/login-errors.js";
import { signAuthToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  generatePasswordResetRawToken,
  hashPasswordResetToken,
} from "../lib/password-reset-token.js";
import { prisma } from "../lib/prisma.js";
import { absoluteUrl } from "../lib/site-url.js";
import { toApiUser } from "../utils/user-mapper.js";

const RESET_TTL_MS = 24 * 60 * 60 * 1000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class AuthService {
  async login(email: string, password: string): Promise<{ user: ApiUser; token: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (!user) {
        console.warn("[auth] Login failed — unknown email");
        throw new AuthHttpError(401, "Invalid email or password");
      }

      if (user.status === "suspended") {
        console.warn("[auth] Login blocked — suspended account", { userId: user.id });
        throw new AuthHttpError(403, "This account has been suspended.");
      }

      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) {
        console.warn("[auth] Login failed — invalid password", { userId: user.id });
        throw new AuthHttpError(401, "Invalid email or password");
      }

      const token = await signAuthToken({ sub: user.id, role: user.role });
      return { user: toApiUser(user), token };
    } catch (e) {
      if (e instanceof AuthHttpError) throw e;
      const { status, body } = loginFailureResponse(e);
      throw new AuthHttpError(status, body.error);
    }
  }

  async signup(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: ApiUser; token: string }> {
    try {
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: "user",
        },
      });
      const token = await signAuthToken({ sub: user.id, role: user.role });
      return { user: toApiUser(user), token };
    } catch (e: unknown) {
      const maybe = e as { code?: string };
      if (maybe?.code === "P2002") {
        throw new AuthHttpError(409, "An account with this email already exists");
      }
      console.error("[auth] Signup failed", e);
      throw new AuthHttpError(500, "Signup failed");
    }
  }

  async getMe(userId: string): Promise<ApiUser | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toApiUser(user) : null;
  }

  async adminSendPasswordReset(
    userId: string
  ): Promise<{ ok: true; emailed: boolean; message: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AuthHttpError(404, "User not found");
    }

    const result = await this.forgotPassword(user.email);
    return {
      ok: true,
      emailed: Boolean(env.resendApiKey && env.resendFromEmail),
      message: result.message,
    };
  }

  async forgotPassword(email: string): Promise<{ ok: true; message: string }> {
    const normalized = email.toLowerCase();

    try {
      const user = await prisma.user.findUnique({ where: { email: normalized } });

      if (user && env.resendApiKey && env.resendFromEmail) {
        await prisma.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null },
        });

        const raw = generatePasswordResetRawToken();
        const tokenHash = hashPasswordResetToken(raw);
        const expiresAt = new Date(Date.now() + RESET_TTL_MS);

        await prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
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

        const resend = new Resend(env.resendApiKey);
        const { error } = await resend.emails.send({
          from: env.resendFromEmail,
          to: [user.email],
          subject: "Reset your Tread Trails password",
          html,
        });

        if (error) {
          console.error("[auth/forgot-password] Resend error:", error);
        }
      } else if (user) {
        console.error(
          "[auth/forgot-password] RESEND_API_KEY / RESEND_FROM_EMAIL missing — cannot send reset email"
        );
      }
    } catch (e) {
      console.error("[auth/forgot-password]", e);
    }

    return {
      ok: true,
      message:
        "If an account exists for that email, we sent reset instructions. Check your inbox and spam folder.",
    };
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = hashPasswordResetToken(token.trim());

    try {
      const row = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
        throw new AuthHttpError(
          400,
          "This reset link is invalid or has expired. Request a new one from the forgot password page."
        );
      }

      const passwordHash = await hashPassword(password);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: row.userId },
          data: { passwordHash },
        }),
        prisma.passwordResetToken.update({
          where: { id: row.id },
          data: { usedAt: new Date() },
        }),
        prisma.passwordResetToken.deleteMany({
          where: { userId: row.userId, usedAt: null, id: { not: row.id } },
        }),
      ]);
    } catch (e) {
      if (e instanceof AuthHttpError) throw e;
      console.error("[auth/reset-password]", e);
      throw new AuthHttpError(500, "Could not reset password");
    }
  }
}

export class AuthHttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AuthHttpError";
  }
}

export const authService = new AuthService();
