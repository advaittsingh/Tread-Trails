import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { LeadStatus } from "@prisma/client";
import { z } from "zod";

import {
  mapAdminLeadDetail,
  mapAdminLeadListRow,
  mapLeadEmailLogs,
  mapLeadTimeline,
} from "../../lib/admin/map-admin-lead.js";
import { logAdminAction } from "../../lib/admin/admin-audit.js";
import {
  buildLeadEmail,
  type LeadEmailTemplateId,
} from "../../lib/email/lead-email-templates.js";
import { sendTransactionalEmail } from "../../lib/email/transactional.js";
import { prisma } from "../../lib/prisma.js";
import { leadStatusTimestampPatch } from "../../services/admin/lead-status.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

const patchSchema = z.object({
  status: z
    .enum(["new", "contacted", "qualified", "converted", "closed"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  adminNotes: z.string().max(12000).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
});

const emailBodySchema = z.object({
  template: z.enum([
    "interest",
    "follow_up",
    "qualified_next_steps",
    "thank_you",
  ]),
  firstName: z.string().max(80).optional(),
});

const leadInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;

export async function listLeads(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  const source = String(req.query.source ?? "").trim();
  const priority = String(req.query.priority ?? "").trim();
  const assignedToId = String(req.query.assignedToId ?? "").trim();
  const unassigned = req.query.unassigned === "1";

  const where: Prisma.LeadWhereInput = {};

  if (status && status !== "all") {
    where.status = status as Prisma.EnumLeadStatusFilter["equals"];
  }
  if (source && source !== "all") {
    where.source = source as Prisma.EnumLeadSourceFilter["equals"];
  }
  if (priority && priority !== "all") {
    where.priority = priority as Prisma.EnumLeadPriorityFilter["equals"];
  }
  if (assignedToId) {
    where.assignedToId = assignedToId;
  } else if (unassigned) {
    where.assignedToId = null;
  }

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: leadInclude,
      }),
      prisma.lead.count({ where }),
    ]);

    return res.json({
      leads: rows.map(mapAdminLeadListRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("[admin/leads] list failed", e);
    return res.status(500).json({ error: "Failed to load leads" });
  }
}

export async function listLeadAssignees(_req: Request, res: Response) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    return res.json({ assignees: admins });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load assignees" });
  }
}

export async function getLead(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });
    if (!lead) {
      return res.status(404).json({ error: "Not found" });
    }

    const [emailLogs, auditLog] = await Promise.all([
      prisma.leadEmailLog.findMany({
        where: { leadId: lead.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { admin: { select: { name: true } } },
      }),
      prisma.adminAuditLog.findMany({
        where: { entity: "lead", entityId: lead.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, action: true, meta: true, createdAt: true },
      }),
    ]);

    const timeline = mapLeadTimeline(lead, emailLogs);
    for (const entry of auditLog) {
      if (entry.action.startsWith("lead.")) {
        timeline.push({
          id: `audit-${entry.id}`,
          kind: "admin",
          title: entry.action.replace("lead.", "").replace(/_/g, " "),
          detail: JSON.stringify(entry.meta ?? {}),
          at: entry.createdAt.toISOString(),
        });
      }
    }
    timeline.sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
    );

    return res.json({
      lead: mapAdminLeadDetail(lead),
      emailHistory: mapLeadEmailLogs(emailLogs),
      timeline,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load lead" });
  }
}

export async function patchLead(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const prev = await prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });
    if (!prev) {
      return res.status(404).json({ error: "Not found" });
    }

    const data: Record<string, unknown> = {};
    const auditMeta: Record<string, unknown> = {};

    if (parsed.data.status !== undefined && parsed.data.status !== prev.status) {
      Object.assign(
        data,
        leadStatusTimestampPatch(parsed.data.status, prev)
      );
      auditMeta.status = { from: prev.status, to: parsed.data.status };
    }
    if (
      parsed.data.priority !== undefined &&
      parsed.data.priority !== prev.priority
    ) {
      data.priority = parsed.data.priority;
      auditMeta.priority = { from: prev.priority, to: parsed.data.priority };
    }
    if (parsed.data.adminNotes !== undefined) {
      data.adminNotes = parsed.data.adminNotes;
      auditMeta.notesUpdated = true;
    }
    if (parsed.data.assignedToId !== undefined) {
      data.assignedToId = parsed.data.assignedToId;
      auditMeta.assignedToId = parsed.data.assignedToId;
    }

    if (Object.keys(data).length === 0) {
      return res.json({ lead: mapAdminLeadDetail(prev) });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });

    const aid = adminId(req);

    await logAdminAction({
      adminId: aid,
      action: "lead.update",
      entity: "lead",
      entityId: id,
      meta: auditMeta,
    });

    if (parsed.data.status && parsed.data.status !== prev.status) {
      await logAdminAction({
        adminId: aid,
        action: "lead.status_update",
        entity: "lead",
        entityId: id,
        meta: auditMeta.status as Record<string, unknown>,
      });
    }

    const emailLogs = await prisma.leadEmailLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { admin: { select: { name: true } } },
    });

    return res.json({
      lead: mapAdminLeadDetail(lead),
      emailHistory: mapLeadEmailLogs(emailLogs),
      timeline: mapLeadTimeline(lead, emailLogs),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function sendLeadEmail(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = emailBodySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });
    if (!lead) {
      return res.status(404).json({ error: "Not found" });
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
      return res.status(502).json({ error: sent.error });
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
          adminId: adminId(req),
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
        include: leadInclude,
      });

      return [updated, log] as const;
    });

    await logAdminAction({
      adminId: adminId(req),
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

    return res.json({
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
    return res.status(500).json({ error: "Failed to send email" });
  }
}
