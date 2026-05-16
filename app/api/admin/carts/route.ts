import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { mapCartTelemetryRow } from "@/lib/server/cart-recovery";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();
  const view = searchParams.get("view")?.trim();

  let where: Prisma.CartTelemetryWhereInput = { itemCount: { gt: 0 } };

  if (search) {
    where = {
      AND: [
        where,
        {
          OR: [
            { sessionId: { contains: search, mode: "insensitive" } },
            { userEmail: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { lastPath: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };
  }

  if (view === "recoverable") {
    where = {
      AND: [where, { convertedAt: null }, { userEmail: { not: null } }],
    };
  } else if (view === "emailed") {
    where = { AND: [where, { recoveryEmailSentAt: { not: null } }] };
  } else if (view === "converted") {
    where = { AND: [where, { convertedAt: { not: null } }] };
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

    const carts = await Promise.all(rows.map((r) => mapCartTelemetryRow(r)));

    return NextResponse.json({
      carts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("[admin/carts] list failed", e);
    return NextResponse.json({ error: "Failed to load carts" }, { status: 500 });
  }
}
