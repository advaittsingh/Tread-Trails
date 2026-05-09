import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { CartTelemetry } from "@/lib/models/CartTelemetry";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;

  try {
    await connectDB();
    const filter = { itemCount: { $gt: 0 } as const };
    const [rows, total] = await Promise.all([
      CartTelemetry.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CartTelemetry.countDocuments(filter),
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
