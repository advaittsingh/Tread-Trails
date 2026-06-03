import type { Request, Response } from "express";
import type Stripe from "stripe";

import { prisma } from "../lib/prisma.js";
import { getStripe } from "../lib/stripe.js";

export async function postStripeWebhook(req: Request, res: Response) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "Webhook not configured" });
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    return res.status(400).json({ error: "Missing stripe-signature" });
  }

  const rawBody =
    typeof req.body === "string"
      ? req.body
      : Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : "";

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature failed", err);
    return res.status(400).json({ error: "Invalid signature" });
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

    return res.json({ received: true });
  } catch (e) {
    console.error("[stripe webhook] handler failed", e);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
