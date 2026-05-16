import { NextResponse } from "next/server";
import { z } from "zod";

import {
  mapAdminLeadDetail,
  mapLeadEmailLogs,
  mapLeadTimeline,
} from "@/lib/admin/map-admin-lead";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { leadStatusTimestampPatch } from "@/lib/server/create-lead";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z
    .enum(["new", "contacted", "qualified", "converted", "closed"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  adminNotes: z.string().max(12000).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
});

const leadInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: context.params.id },
      include: leadInclude,
    });
    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    return NextResponse.json({
      lead: mapAdminLeadDetail(lead),
      emailHistory: mapLeadEmailLogs(emailLogs),
      timeline,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load lead" }, { status: 500 });
  }
}

export async function PATCH(
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

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const prev = await prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });
    if (!prev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      return NextResponse.json({ lead: mapAdminLeadDetail(prev) });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "lead.update",
      entity: "lead",
      entityId: id,
      meta: auditMeta,
    });

    if (parsed.data.status && parsed.data.status !== prev.status) {
      await logAdminAction({
        adminId: gate.auth.userId,
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

    return NextResponse.json({
      lead: mapAdminLeadDetail(lead),
      emailHistory: mapLeadEmailLogs(emailLogs),
      timeline: mapLeadTimeline(lead, emailLogs),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
