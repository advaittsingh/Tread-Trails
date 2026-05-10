import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/** Minimal paid-order receipt for post-checkout UX — requires knowing opaque order id */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");
  if (!orderId) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        total: true,
        currency: true,
        customerEmail: true,
        paymentMethod: true,
      },
    });

    if (!order || order.status !== "paid") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        total: order.total,
        currency: order.currency,
        customerEmail: order.customerEmail,
        paymentMethod: order.paymentMethod,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
