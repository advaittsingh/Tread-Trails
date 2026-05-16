import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

const SEVERITIES = ["debug", "info", "warn", "error", "fatal"] as const;
const CATEGORIES = [
  "api",
  "auth",
  "payment",
  "booking",
  "webhook",
  "email",
  "system",
] as const;

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 40));
  const skip = (page - 1) * limit;

  const severity = searchParams.get("severity")?.trim();
  const category = searchParams.get("category")?.trim();
  const route = searchParams.get("route")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();

  const where: Prisma.AppErrorLogWhereInput = {};

  if (severity && severity !== "all" && SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) {
    where.severity = severity;
  }
  if (category && category !== "all" && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    where.category = category;
  }
  if (route) {
    where.route = { contains: route, mode: "insensitive" };
  }
  if (from || to) {
    where.createdAt = {};
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const end = new Date(`${to}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      where.createdAt.lt = end;
    }
  }

  try {
    const [rows, total, severityCounts] = await Promise.all([
      prisma.appErrorLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          severity: true,
          category: true,
          source: true,
          route: true,
          message: true,
          stack: true,
          userId: true,
          createdAt: true,
        },
      }),
      prisma.appErrorLog.count({ where }),
      prisma.appErrorLog.groupBy({
        by: ["severity"],
        where,
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      errors: rows.map((r) => ({
        id: r.id,
        severity: r.severity,
        category: r.category,
        source: r.source,
        route: r.route,
        message: r.message,
        stack: r.stack,
        userId: r.userId,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      severityCounts: Object.fromEntries(
        severityCounts.map((s) => [s.severity, s._count._all])
      ),
      integrations: {
        sentry: Boolean(process.env.SENTRY_DSN?.trim()),
        betterStack: Boolean(process.env.BETTERSTACK_SOURCE_TOKEN?.trim()),
      },
    });
  } catch (e) {
    console.error("[admin/errors] failed", e);
    return NextResponse.json({ error: "Failed to load errors" }, { status: 500 });
  }
}
