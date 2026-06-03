import type { z } from "zod";

import { env } from "../config/env.js";
import { markCartsConvertedForEmail } from "../lib/cart-recovery.js";
import { createJuspayPaymentSession } from "../lib/juspay/create-session.js";
import { fetchJuspayOrderStatus } from "../lib/juspay/fetch-order.js";
import {
  CheckoutHttpError,
  resolveCheckoutCart,
} from "../lib/order/checkout-resolution.js";
import { newJuspayMerchantOrderRef } from "../lib/payments/juspay-order-ref.js";
import {
  isJuspayConfigured,
  isRazorpayConfigured,
  isStripePaymentsConfigured,
} from "../lib/payments/gateway-env.js";
import { prisma } from "../lib/prisma.js";
import { createRazorpayServerOrder } from "../lib/razorpay/create-order.js";
import { verifyRazorpayPaymentSignature } from "../lib/razorpay/verify-signature.js";
import { getStripe, inrToStripeAmount } from "../lib/stripe.js";
import type { createCheckoutOrderSchema } from "../validators/storefront.validators.js";

type CheckoutBody = z.infer<typeof createCheckoutOrderSchema>;

function notifyCartConversion(orderId: string, email: string) {
  void markCartsConvertedForEmail(email, orderId);
}

export const ordersService = {
  async createCheckout(
    body: CheckoutBody,
    userId: string | null
  ): Promise<{ status: number; body: unknown }> {
    try {
      const { resolvedItems, total } = await resolveCheckoutCart(body.items);

      const baseData = {
        userId,
        guestEmail: userId ? null : body.customerEmail,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        shippingAddress: {
          line1: body.shippingAddress.line1,
          line2: body.shippingAddress.line2 ?? "",
          city: body.shippingAddress.city,
          region: body.shippingAddress.region,
          postal: body.shippingAddress.postal,
        },
        items: resolvedItems,
        total,
        currency: "INR",
        status: "pending" as const,
      };

      if (body.paymentChannel === "cod") {
        const order = await prisma.order.create({
          data: { ...baseData, paymentMethod: "cod" },
        });
        notifyCartConversion(order.id, body.customerEmail);
        return {
          status: 200,
          body: {
            mode: "cod",
            orderId: order.id,
            message:
              "Order recorded as cash on delivery. Our team will confirm availability and schedule dispatch.",
          },
        };
      }

      if (body.paymentChannel === "stripe") {
        if (!isStripePaymentsConfigured()) {
          return {
            status: 503,
            body: { error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." },
          };
        }

        const stripe = getStripe();
        const order = await prisma.order.create({
          data: { ...baseData, paymentMethod: "stripe" },
        });
        notifyCartConversion(order.id, body.customerEmail);

        const base = env.siteUrl.replace(/\/$/, "");
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: body.customerEmail,
          client_reference_id: order.id,
          metadata: { orderId: order.id },
          success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${base}/checkout/canceled`,
          line_items: resolvedItems.map((line) => ({
            quantity: line.quantity,
            price_data: {
              currency: "inr",
              unit_amount: inrToStripeAmount(line.unitPrice),
              product_data: {
                name: `${line.name} (${line.variantLabel})`,
                metadata: {
                  productSlug: line.productSlug,
                  variantId: line.variantId,
                },
              },
            },
          })),
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { stripeCheckoutSessionId: session.id },
        });

        if (!session.url) {
          return {
            status: 502,
            body: { error: "Stripe session did not return a checkout URL" },
          };
        }

        return {
          status: 200,
          body: { mode: "stripe", orderId: order.id, checkoutUrl: session.url },
        };
      }

      if (body.paymentChannel === "razorpay") {
        if (!isRazorpayConfigured()) {
          return { status: 503, body: { error: "Razorpay is not configured." } };
        }

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
        if (!keyId) {
          return {
            status: 503,
            body: {
              error:
                "Razorpay public key missing — set NEXT_PUBLIC_RAZORPAY_KEY_ID for Checkout.",
            },
          };
        }

        const amountPaise = total * 100;
        if (!Number.isFinite(amountPaise) || amountPaise < 100) {
          return {
            status: 400,
            body: { error: "Order total too small for Razorpay (minimum ₹1)." },
          };
        }

        const order = await prisma.order.create({
          data: { ...baseData, paymentMethod: "razorpay" },
        });
        notifyCartConversion(order.id, body.customerEmail);

        try {
          const rz = await createRazorpayServerOrder({
            amountPaise,
            receipt: order.id.replace(/[^a-z0-9]/gi, "").slice(0, 40),
            notes: { treadOrderId: order.id },
          });

          await prisma.order.update({
            where: { id: order.id },
            data: { razorpayOrderId: rz.id },
          });

          return {
            status: 200,
            body: {
              mode: "razorpay",
              orderId: order.id,
              razorpayOrderId: rz.id,
              amountPaise,
              currency: "INR",
              keyId,
              prefillEmail: body.customerEmail,
              prefillContact: body.customerPhone.replace(/\D/g, "").slice(-15),
            },
          };
        } catch (e) {
          console.error("[razorpay] checkout start failed", e);
          await prisma.order.delete({ where: { id: order.id } });
          return {
            status: 502,
            body: { error: "Could not start Razorpay checkout — try again." },
          };
        }
      }

      if (body.paymentChannel === "juspay") {
        if (!isJuspayConfigured()) {
          return { status: 503, body: { error: "Juspay is not configured." } };
        }

        const juspayRef = newJuspayMerchantOrderRef();
        const base = env.siteUrl.replace(/\/$/, "");

        const order = await prisma.order.create({
          data: {
            ...baseData,
            paymentMethod: "juspay",
            juspayCheckoutOrderRef: juspayRef,
          },
        });
        notifyCartConversion(order.id, body.customerEmail);

        const routingId =
          userId ?? body.customerEmail.replace(/[^a-z0-9]/gi, "").slice(0, 48);

        const session = await createJuspayPaymentSession({
          merchantOrderRef: juspayRef,
          amountInr: total,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          customerName: body.customerName,
          routingId,
          returnUrl: `${base}/checkout/success?gateway=juspay&order_id=${encodeURIComponent(order.id)}`,
        });

        if (!session.ok) {
          console.error("[juspay] session failed", session.error);
          await prisma.order.delete({ where: { id: order.id } });
          return { status: 502, body: { error: session.error } };
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { juspayGatewayOrderId: session.gatewayOrderId },
        });

        return {
          status: 200,
          body: {
            mode: "juspay",
            orderId: order.id,
            paymentLink: session.paymentLinkWeb,
          },
        };
      }

      return { status: 400, body: { error: "Unsupported payment channel" } };
    } catch (e) {
      if (e instanceof CheckoutHttpError) {
        return { status: e.status, body: { error: e.message } };
      }
      console.error("[orders] checkout failed", e);
      return { status: 500, body: { error: "Could not create order" } };
    }
  },

  async listForUser(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        total: true,
        currency: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        items: true,
      },
    });

    return orders.map((o) => {
      const items = Array.isArray(o.items)
        ? (o.items as { name?: string; quantity?: number }[])
        : [];
      return {
        id: o.id,
        total: o.total,
        currency: o.currency,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        itemSummary: items
          .slice(0, 3)
          .map((i) => `${i.name ?? "Item"} × ${i.quantity ?? 1}`)
          .join(" · "),
        itemCount: items.length,
      };
    });
  },

  async verifyStripeSession(sessionId: string) {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { status: 503 as const, body: { error: "Stripe not configured" } };
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId =
      session.metadata?.orderId ?? session.client_reference_id ?? undefined;

    if (!orderId) {
      return { status: 404 as const, body: { error: "Order not linked to session" } };
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { status: 404 as const, body: { error: "Order not found" } };
    }

    const paid =
      session.payment_status === "paid" || order.status === "paid";

    return {
      status: 200 as const,
      body: {
        order: {
          id: order.id,
          total: order.total,
          currency: order.currency,
          status: paid ? "paid" : order.status,
          customerEmail: order.customerEmail,
        },
        stripePaymentStatus: session.payment_status,
      },
    };
  },

  async getReceipt(orderId: string) {
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
      return { status: 404 as const, body: { error: "Not found" } };
    }

    return {
      status: 200 as const,
      body: {
        order: {
          total: order.total,
          currency: order.currency,
          customerEmail: order.customerEmail,
          paymentMethod: order.paymentMethod,
        },
      },
    };
  },

  async verifyRazorpay(data: {
    treadTrailsOrderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!secret) {
      return { status: 503 as const, body: { error: "Razorpay not configured" } };
    }

    const okSig = verifyRazorpayPaymentSignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature,
      secret
    );

    if (!okSig) {
      return { status: 400 as const, body: { error: "Invalid payment signature" } };
    }

    const order = await prisma.order.findUnique({
      where: { id: data.treadTrailsOrderId },
    });

    if (!order || order.paymentMethod !== "razorpay") {
      return { status: 404 as const, body: { error: "Order not found" } };
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== data.razorpay_order_id) {
      return { status: 400 as const, body: { error: "Order mismatch" } };
    }

    if (order.status === "paid") {
      return { status: 200 as const, body: { ok: true, alreadyPaid: true } };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
      },
    });

    return { status: 200 as const, body: { ok: true } };
  },

  async syncJuspay(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.paymentMethod !== "juspay") {
      return { status: 404 as const, body: { error: "Order not found" } };
    }

    const ref = order.juspayCheckoutOrderRef;
    if (!ref) {
      return { status: 400 as const, body: { error: "Missing Juspay reference" } };
    }

    const remote = await fetchJuspayOrderStatus(ref);
    if (!remote.ok || !remote.status) {
      return {
        status: 502 as const,
        body: { error: remote.error ?? "Could not read Juspay order" },
      };
    }

    const paid = ["CHARGED", "PARTIAL_CHARGED", "AUTHORIZATION_SUCCEEDED"].includes(
      remote.status.toUpperCase()
    );

    if (paid && order.status !== "paid") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid", paidAt: new Date() },
      });
    }

    return {
      status: 200 as const,
      body: {
        paid,
        juspayStatus: remote.status,
        order: {
          id: order.id,
          total: order.total,
          currency: order.currency,
          status: paid ? "paid" : order.status,
          customerEmail: order.customerEmail,
        },
      },
    };
  },
};
