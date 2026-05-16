import { NextResponse } from "next/server";
import { InboxKind } from "@prisma/client";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { createLeadFromCorporate } from "@/lib/server/create-lead";
import { logAppError } from "@/lib/server/log-app-error";
import { corporateInquirySchema } from "@/lib/validations/corporate-inquiry";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
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

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to =
    process.env.CORPORATE_TO_EMAIL?.trim() || process.env.CONTACT_TO_EMAIL?.trim();

  const inboxRow = await prisma.inboxSubmission.create({
    data: {
      kind: InboxKind.corporate,
      payload: {
        companyName,
        contactPerson,
        email,
        phone,
        businessType,
        requirements,
      },
      emailSent: false,
    },
  });

  try {
    await createLeadFromCorporate({
      companyName,
      contactPerson,
      email,
      phone,
      businessType,
      requirements,
      inboxSubmissionId: inboxRow.id,
    });
  } catch (e) {
    console.error("[corporate-inquiry] lead create failed", e);
  }

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      {
        error:
          "Corporate inquiry email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and CORPORATE_TO_EMAIL or CONTACT_TO_EMAIL.",
        inboxId: inboxRow.id,
      },
      { status: 503 }
    );
  }

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
      await logAppError({
        source: "corporate-inquiry",
        message: error.message ?? "Resend failed",
        meta: { inboxId: inboxRow.id },
      });
      return NextResponse.json(
        { error: error.message ?? "Could not send inquiry" },
        { status: 502 }
      );
    }
    await prisma.inboxSubmission.update({
      where: { id: inboxRow.id },
      data: { emailSent: true },
    });
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error(e);
    await logAppError({
      source: "corporate-inquiry",
      message: e instanceof Error ? e.message : "Corporate send failed",
      meta: { inboxId: inboxRow.id },
    });
    return NextResponse.json(
      { error: "Could not send inquiry — try again shortly." },
      { status: 502 }
    );
  }
}
