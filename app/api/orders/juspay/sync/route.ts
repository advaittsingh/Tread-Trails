import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchJuspayOrderStatus } from "@/lib/juspay/fetch-order";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orderId: z.string().min(1).max(80),
});

function isJuspayPaidStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toUpperCase();
  return (
    s === "CHARGED" ||
    s === "PARTIAL_CHARGED" ||
    s === "AUTHORIZATION_SUCCEEDED"
  );
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
    });

    if (!order || order.paymentMethod !== "juspay") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const ref = order.juspayCheckoutOrderRef;
    if (!ref) {
      return NextResponse.json({ error: "Missing Juspay reference" }, { status: 400 });
    }

    const remote = await fetchJuspayOrderStatus(ref);
    if (!remote.ok || !remote.status) {
      return NextResponse.json(
        { error: remote.error ?? "Could not read Juspay order" },
        { status: 502 }
      );
    }

    const paid = isJuspayPaidStatus(remote.status);

    if (paid && order.status !== "paid") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid" },
      });
    }

    return NextResponse.json({
      paid,
      juspayStatus: remote.status,
      order: {
        id: order.id,
        total: order.total,
        currency: order.currency,
        status: paid ? "paid" : order.status,
        customerEmail: order.customerEmail,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
