import { NextResponse } from "next/server";
import { Resend } from "resend";

import { corporateInquirySchema } from "@/lib/validations/corporate-inquiry";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to =
    process.env.CORPORATE_TO_EMAIL?.trim() || process.env.CONTACT_TO_EMAIL?.trim();

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      {
        error:
          "Corporate inquiry email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and CORPORATE_TO_EMAIL or CONTACT_TO_EMAIL.",
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

  const parsed = corporateInquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    companyName,
    contactPerson,
    email,
    phone,
    businessType,
    requirements,
  } = parsed.data;

  const html = `
    <p><strong>New corporate inquiry</strong> from the Tread Trails website.</p>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Company</td><td>${escapeHtml(companyName)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Contact person</td><td>${escapeHtml(contactPerson)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Email</td><td>${escapeHtml(email)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Phone</td><td>${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Business type</td><td>${escapeHtml(businessType)}</td></tr>
    </table>
    <p style="margin-top:16px;"><strong>Requirements</strong></p>
    <p style="white-space:pre-wrap;margin:0;">${escapeHtml(requirements)}</p>
  `.trim();

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Corporate] ${companyName} — ${businessType}`,
      html,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Could not send inquiry" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not send inquiry — try again shortly." },
      { status: 502 }
    );
  }
}
