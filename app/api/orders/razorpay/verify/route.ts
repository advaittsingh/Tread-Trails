import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyRazorpayPaymentSignature } from "@/lib/razorpay/verify-signature";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  treadTrailsOrderId: z.string().min(1).max(80),
  razorpay_order_id: z.string().min(1).max(120),
  razorpay_payment_id: z.string().min(1).max(120),
  razorpay_signature: z.string().min(1).max(512),
});

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
  }

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

  const {
    treadTrailsOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = parsed.data;

  const okSig = verifyRazorpayPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    secret
  );

  if (!okSig) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: treadTrailsOrderId },
    });

    if (!order || order.paymentMethod !== "razorpay") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not finalize payment" }, { status: 500 });
  }
}
