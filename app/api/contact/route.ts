import { NextResponse } from "next/server";
import { InboxKind } from "@prisma/client";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { createLeadFromContact } from "@/lib/server/create-lead";
import { logAppError } from "@/lib/server/log-app-error";
import { contactFormSchema } from "@/lib/validations/contact";

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

  const parsed = contactFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, subject, message } = parsed.data;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  const inboxRow = await prisma.inboxSubmission.create({
    data: {
      kind: InboxKind.contact,
      payload: { name, email, phone, subject, message },
      emailSent: false,
    },
  });

  try {
    await createLeadFromContact({
      name,
      email,
      phone,
      subject,
      message,
      inboxSubmissionId: inboxRow.id,
    });
  } catch (e) {
    console.error("[contact] lead create failed", e);
  }

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      {
        error:
          "Contact form email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and CONTACT_TO_EMAIL.",
        inboxId: inboxRow.id,
      },
      { status: 503 }
    );
  }

  const safeSubject = escapeHtml(subject);
  const html = `
    <p><strong>New message</strong> from the Tread Trails contact form.</p>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Name</td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Email</td><td>${escapeHtml(email)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Phone</td><td>${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Subject</td><td>${safeSubject}</td></tr>
    </table>
    <p style="margin-top:16px;"><strong>Message</strong></p>
    <p style="white-space:pre-wrap;margin:0;">${escapeHtml(message)}</p>
  `.trim();

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html,
    });
    if (error) {
      await logAppError({
        source: "contact",
        message: error.message ?? "Resend failed",
        route: "/api/contact",
        meta: { inboxId: inboxRow.id },
      });
      return NextResponse.json(
        { error: error.message ?? "Could not send message" },
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
      source: "contact",
      message: e instanceof Error ? e.message : "Contact send failed",
      route: "/api/contact",
      error: e,
      meta: { inboxId: inboxRow.id },
    });
    return NextResponse.json(
      { error: "Could not send message — try again shortly." },
      { status: 502 }
    );
  }
}
