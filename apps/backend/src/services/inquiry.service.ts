import { InboxKind, LeadPriority, LeadSource, LeadStatus } from "@prisma/client";
import { Resend } from "resend";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function createLeadFromContact(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  inboxSubmissionId?: string;
}) {
  return prisma.lead.create({
    data: {
      source: LeadSource.contact,
      status: LeadStatus.new,
      priority: LeadPriority.normal,
      displayName: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim() || null,
      subject: input.subject.trim(),
      message: input.message.trim(),
      inboxSubmissionId: input.inboxSubmissionId ?? null,
    },
  });
}

async function createLeadFromCorporate(input: {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  requirements: string;
  inboxSubmissionId?: string;
}) {
  return prisma.lead.create({
    data: {
      source: LeadSource.corporate,
      status: LeadStatus.new,
      priority: LeadPriority.high,
      displayName: input.companyName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim() || null,
      companyName: input.companyName.trim(),
      contactPerson: input.contactPerson.trim(),
      businessType: input.businessType,
      requirements: input.requirements.trim(),
      inboxSubmissionId: input.inboxSubmissionId ?? null,
    },
  });
}

export const inquiryService = {
  async submitContact(data: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) {
    const { name, email, phone, subject, message } = data;

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

    const apiKey = env.resendApiKey;
    const from = env.resendFromEmail;
    const to = env.contactToEmail;

    if (!apiKey || !from || !to) {
      return {
        status: 503 as const,
        body: {
          error:
            "Contact form email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and CONTACT_TO_EMAIL.",
          inboxId: inboxRow.id,
        },
      };
    }

    const html = `
    <p><strong>New message</strong> from the Tread Trails contact form.</p>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Name</td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Email</td><td>${escapeHtml(email)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Phone</td><td>${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Subject</td><td>${escapeHtml(subject)}</td></tr>
    </table>
    <p style="margin-top:16px;"><strong>Message</strong></p>
    <p style="white-space:pre-wrap;margin:0;">${escapeHtml(message)}</p>
  `.trim();

    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html,
    });

    if (error) {
      return {
        status: 502 as const,
        body: { error: error.message ?? "Could not send message" },
      };
    }

    await prisma.inboxSubmission.update({
      where: { id: inboxRow.id },
      data: { emailSent: true },
    });

    return { status: 200 as const, body: { ok: true, id: sent?.id } };
  },

  async submitCorporate(data: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    businessType: string;
    requirements: string;
  }) {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      businessType,
      requirements,
    } = data;

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
      console.error("[corporate] lead create failed", e);
    }

    const apiKey = env.resendApiKey;
    const from = env.resendFromEmail;
    const to = env.contactToEmail;

    if (!apiKey || !from || !to) {
      return {
        status: 503 as const,
        body: {
          error:
            "Corporate inquiry email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL, and CONTACT_TO_EMAIL.",
          inboxId: inboxRow.id,
        },
      };
    }

    const html = `
    <p><strong>Corporate inquiry</strong> from Tread Trails.</p>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Company</td><td>${escapeHtml(companyName)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Contact</td><td>${escapeHtml(contactPerson)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Email</td><td>${escapeHtml(email)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Phone</td><td>${escapeHtml(phone)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#555;">Type</td><td>${escapeHtml(businessType)}</td></tr>
    </table>
    <p style="margin-top:16px;"><strong>Requirements</strong></p>
    <p style="white-space:pre-wrap;margin:0;">${escapeHtml(requirements)}</p>
  `.trim();

    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Corporate] ${companyName}`,
      html,
    });

    if (error) {
      return {
        status: 502 as const,
        body: { error: error.message ?? "Could not send inquiry" },
      };
    }

    await prisma.inboxSubmission.update({
      where: { id: inboxRow.id },
      data: { emailSent: true },
    });

    return { status: 200 as const, body: { ok: true, id: sent?.id } };
  },
};
