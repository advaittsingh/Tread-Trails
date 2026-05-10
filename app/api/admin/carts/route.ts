import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

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

  let where: Prisma.CartTelemetryWhereInput;
  if (search) {
    where = {
      AND: [
        { itemCount: { gt: 0 } },
        {
          OR: [
            { sessionId: { contains: search, mode: "insensitive" } },
            { userEmail: { contains: search, mode: "insensitive" } },
            { lastPath: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };
  } else {
    where = { itemCount: { gt: 0 } };
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.cartTelemetry.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.cartTelemetry.count({ where }),
    ]);

    return NextResponse.json({
      carts: rows.map((c) => ({
        sessionId: c.sessionId,
        itemCount: c.itemCount,
        subtotalHint: c.subtotalHint,
        userEmail: c.userEmail || null,
        lastPath: c.lastPath,
        updatedAt: c.updatedAt,
        lines: c.lines,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load carts" }, { status: 500 });
  }
}
