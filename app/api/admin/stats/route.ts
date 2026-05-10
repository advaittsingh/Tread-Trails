import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const [totalOrders, paidOrderCount, revenueAgg, totalBookings] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "paid" } }),
        prisma.order.aggregate({
          where: { status: "paid" },
          _sum: { total: true },
        }),
        prisma.booking.count(),
      ]);

    const totalRevenuePaid = revenueAgg._sum.total ?? 0;

    return NextResponse.json({
      totalOrders,
      paidOrderCount,
      totalRevenuePaid,
      totalBookings,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
