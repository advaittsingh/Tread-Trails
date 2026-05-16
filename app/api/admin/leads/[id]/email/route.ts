import { NextResponse } from "next/server";
import { LeadStatus } from "@prisma/client";
import { z } from "zod";

import {
  buildLeadEmail,
  type LeadEmailTemplateId,
} from "@/lib/email/lead-email-templates";
import { sendTransactionalEmail } from "@/lib/email/transactional";
import { mapAdminLeadDetail, mapLeadEmailLogs } from "@/lib/admin/map-admin-lead";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  template: z.enum([
    "interest",
    "follow_up",
    "qualified_next_steps",
    "thank_you",
  ]),
  firstName: z.string().max(80).optional(),
});

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { id } = context.params;
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

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const firstName =
      parsed.data.firstName?.trim() ||
      lead.contactPerson?.split(" ")[0] ||
      lead.displayName.split(" ")[0] ||
      "there";

    const template = parsed.data.template as LeadEmailTemplateId;
    const { subject, html, preview } = buildLeadEmail(template, {
      firstName,
      companyName: lead.companyName ?? undefined,
      subject: lead.subject ?? undefined,
    });

    const sent = await sendTransactionalEmail({
      to: lead.email,
      subject,
      html,
    });

    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 502 });
    }

    const now = new Date();
    const statusPatch =
      lead.status === LeadStatus.new
        ? {
            status: LeadStatus.contacted,
            contactedAt: lead.contactedAt ?? now,
          }
        : {};

    const [updatedLead, emailLog] = await prisma.$transaction(async (tx) => {
      const log = await tx.leadEmailLog.create({
        data: {
          leadId: lead.id,
          adminId: gate.auth.userId,
          to: lead.email,
          subject,
          template,
          bodyPreview: preview.slice(0, 500),
          provider: sent.provider,
          messageId: sent.id ?? null,
        },
      });

      const updated = await tx.lead.update({
        where: { id: lead.id },
        data: statusPatch,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      return [updated, log] as const;
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "lead.email_sent",
      entity: "lead",
      entityId: id,
      meta: {
        template,
        subject,
        messageId: sent.id,
        provider: sent.provider,
      },
    });

    const allLogs = await prisma.leadEmailLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { admin: { select: { name: true } } },
    });

    console.info("[lead] email sent", {
      leadId: id,
      to: lead.email,
      template,
      provider: sent.provider,
    });

    return NextResponse.json({
      ok: true,
      lead: mapAdminLeadDetail(updatedLead),
      emailLog: {
        id: emailLog.id,
        subject: emailLog.subject,
        createdAt: emailLog.createdAt.toISOString(),
      },
      emailHistory: mapLeadEmailLogs(allLogs),
      provider: sent.provider,
    });
  } catch (e) {
    console.error("[lead] email failed", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
