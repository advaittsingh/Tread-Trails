import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/request-user";

const bodySchema = z.object({
  to: z.string().email(),
  template: z.enum(["complete_order", "interest"]),
  firstName: z.string().max(80).optional(),
});

function htmlForTemplate(
  template: "complete_order" | "interest",
  firstName?: string
): { subject: string; html: string } {
  const name = firstName?.trim() || "there";
  if (template === "complete_order") {
    return {
      subject: "Complete your Tread Trails order",
      html: `<p>Hi ${name},</p><p>We saved your build sheet — reply when you are ready to resume checkout.</p><p>— Tread Trails Concierge</p>`,
    };
  }
  return {
    subject: "We noticed your interest",
    html: `<p>Hi ${name},</p><p>Our expedition engineers can spec the right kit for your platform. Want a quick call?</p><p>— Tread Trails</p>`,
  };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          "Email not configured — set RESEND_API_KEY and RESEND_FROM_EMAIL (verified sender).",
      },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const resend = new Resend(apiKey);
  const { subject, html } = htmlForTemplate(
    parsed.data.template,
    parsed.data.firstName
  );

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: parsed.data.to,
      subject,
      html,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Resend send failed" }, { status: 502 });
  }
}
