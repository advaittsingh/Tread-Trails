/**
 * Admin-only transactional sends via Resend or SendGrid.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/request-user";
import {
  emailProviderLabel,
  sendTransactionalEmail,
} from "@/lib/email/transactional";
import { logAdminAction } from "@/lib/server/admin-audit";

const TEMPLATES = [
  "complete_order",
  "cart_waiting",
  "interest",
  "booking_confirmed",
  "order_shipped",
] as const;

type TemplateId = (typeof TEMPLATES)[number];

const bodySchema = z.object({
  to: z.string().email(),
  template: z.enum(TEMPLATES),
  firstName: z.string().max(80).optional(),
});

function htmlForTemplate(
  template: TemplateId,
  firstName?: string
): { subject: string; html: string } {
  const name = firstName?.trim() || "there";
  switch (template) {
    case "complete_order":
      return {
        subject: "Complete your Tread Trails order",
        html: `<p>Hi ${name},</p><p>We saved your build sheet — reply when you are ready to resume checkout.</p><p>— Tread Trails Concierge</p>`,
      };
    case "cart_waiting":
      return {
        subject: "Your cart is waiting — Tread Trails",
        html: `<p>Hi ${name},</p><p>Your expedition gear is still in cart. Finish checkout when you are ready — we are here for fitment questions.</p><p>— Tread Trails</p>`,
      };
    case "interest":
      return {
        subject: "We noticed your interest",
        html: `<p>Hi ${name},</p><p>Our expedition engineers can spec the right kit for your platform. Want a quick call?</p><p>— Tread Trails</p>`,
      };
    case "booking_confirmed":
      return {
        subject: "Your Tread Trails bay booking is confirmed",
        html: `<p>Hi ${name},</p><p>Your installation / consultation slot is confirmed. Our studio team will reach out if anything changes.</p><p>— Tread Trails</p>`,
      };
    case "order_shipped":
      return {
        subject: "Your Tread Trails order has shipped",
        html: `<p>Hi ${name},</p><p>Your order is on the way. Tracking details will follow separately if applicable.</p><p>— Tread Trails Fulfilment</p>`,
      };
    default:
      return {
        subject: "Message from Tread Trails",
        html: `<p>Hi ${name},</p><p>Thanks for choosing Tread Trails.</p>`,
      };
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  if (emailProviderLabel() === "none") {
    return NextResponse.json(
      {
        error:
          "Email not configured — set RESEND_API_KEY or SENDGRID_API_KEY plus a verified from address.",
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

  const { subject, html } = htmlForTemplate(
    parsed.data.template,
    parsed.data.firstName
  );

  const sent = await sendTransactionalEmail({
    to: parsed.data.to,
    subject,
    html,
  });

  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 502 });
  }

  await logAdminAction({
    adminId: gate.auth.userId,
    action: "crm.email_sent",
    entity: "crm",
    entityId: parsed.data.to,
    meta: { template: parsed.data.template, provider: sent.provider },
  });

  return NextResponse.json({ ok: true, id: sent.id, provider: sent.provider });
}
