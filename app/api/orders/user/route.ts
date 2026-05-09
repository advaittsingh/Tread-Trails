import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  try {
    await connectDB();
    const orders = await Order.find({ userId: gate.auth.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        total: o.total,
        currency: o.currency,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        itemSummary: o.items
          .slice(0, 3)
          .map((i: { name: string; quantity: number }) => `${i.name} × ${i.quantity}`)
          .join(" · "),
        itemCount: o.items.length,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
