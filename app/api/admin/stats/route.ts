import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { Booking } from "@/lib/models/Booking";
import { Order } from "@/lib/models/Order";

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    await connectDB();

    const [totalOrders, paidOrderCount, revenueAgg, totalBookings] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: "paid" }),
        Order.aggregate<{ sum: number }>([
          { $match: { status: "paid" } },
          { $group: { _id: null as null, sum: { $sum: "$total" } } },
        ]),
        Booking.countDocuments(),
      ]);

    const totalRevenuePaid = revenueAgg[0]?.sum ?? 0;

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
