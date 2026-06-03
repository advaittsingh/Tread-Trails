import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { pagination } from "./utils.js";

function formatJson(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function getAudit(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const entity = String(req.query.entity ?? "").trim() || undefined;
  const action = String(req.query.action ?? "").trim() || undefined;
  const category = String(req.query.category ?? "").trim() || undefined;
  const search = String(req.query.search ?? "").trim() || undefined;

  try {
    const clauses: Prisma.AdminAuditLogWhereInput[] = [];
    if (entity) clauses.push({ entity });
    if (action) {
      clauses.push({ action: { contains: action, mode: "insensitive" } });
    }
    if (category) {
      const categoryMap: Record<string, Prisma.AdminAuditLogWhereInput> = {
        product: {
          OR: [
            { entity: "product" },
            { action: { startsWith: "product." } },
          ],
        },
        inventory: {
          OR: [
            { entity: "inventory" },
            { action: { startsWith: "inventory." } },
          ],
        },
        user: {
          OR: [{ entity: "user" }, { action: { startsWith: "user." } }],
        },
        order: {
          OR: [{ entity: "order" }, { action: { startsWith: "order." } }],
        },
        cms: {
          OR: [{ entity: "cms" }, { action: { startsWith: "cms." } }],
        },
      };
      if (categoryMap[category]) clauses.push(categoryMap[category]!);
    }
    if (search) {
      clauses.push({
        OR: [
          { action: { contains: search, mode: "insensitive" } },
          { entity: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
          { adminId: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.AdminAuditLogWhereInput =
      clauses.length === 0
        ? {}
        : clauses.length === 1
          ? clauses[0]!
          : { AND: clauses };

    const [rows, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    const adminIds = [...new Set(rows.map((r) => r.adminId))];
    const admins = adminIds.length
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const adminById = new Map(admins.map((a) => [a.id, a]));

    return res.json({
      logs: rows.map((row) => {
        const admin = adminById.get(row.adminId);
        return {
          id: row.id,
          adminId: row.adminId,
          adminName: admin?.name ?? null,
          adminEmail: admin?.email ?? null,
          action: row.action,
          entity: row.entity,
          entityId: row.entityId,
          previousValue: row.previousValue,
          newValue: row.newValue,
          previousSummary: formatJson(row.previousValue),
          newSummary: formatJson(row.newValue),
          meta: row.meta,
          createdAt: row.createdAt.toISOString(),
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load audit log" });
  }
}
