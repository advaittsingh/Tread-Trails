import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { mapAdminLeadListRow } from "@/lib/admin/map-admin-lead";
import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim();
  const source = searchParams.get("source")?.trim();
  const priority = searchParams.get("priority")?.trim();
  const assignedToId = searchParams.get("assignedToId")?.trim();
  const unassigned = searchParams.get("unassigned") === "1";

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
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads: rows.map(mapAdminLeadListRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("[admin/leads] list failed", e);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
