import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/** Used after Stripe redirect — webhook may still be processing */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const orderId =
      session.metadata?.orderId ??
      session.client_reference_id ??
      undefined;

    if (!orderId) {
      return NextResponse.json({ error: "Order not linked to session" }, { status: 404 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paid =
      session.payment_status === "paid" ||
      order.status === "paid";

    return NextResponse.json({
      order: {
        id: order.id,
        total: order.total,
        currency: order.currency,
        status: paid ? "paid" : order.status,
        customerEmail: order.customerEmail,
      },
      stripePaymentStatus: session.payment_status,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
