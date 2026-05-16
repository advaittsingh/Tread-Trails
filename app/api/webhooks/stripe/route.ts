import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { logWebhookFailure } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    void logWebhookFailure("/api/webhooks/stripe", "STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    void logWebhookFailure(
      "/api/webhooks/stripe",
      "Stripe webhook signature verification failed",
      err,
      { provider: "stripe" }
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.orderId;
      if (orderId) {
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            paidAt: new Date(),
            stripeCheckoutSessionId: session.id,
            ...(pi ? { stripePaymentIntentId: pi } : {}),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    void logWebhookFailure(
      "/api/webhooks/stripe",
      "Stripe webhook handler error",
      e,
      { eventType: event.type }
    );
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
