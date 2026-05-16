import { NextResponse } from "next/server";

import { getOptionalAuth } from "@/lib/auth/request-user";
import { createJuspayPaymentSession } from "@/lib/juspay/create-session";
import { resolveCheckoutCart } from "@/lib/order/checkout-resolution";
import {
  isJuspayConfigured,
  isRazorpayConfigured,
  isStripePaymentsConfigured,
} from "@/lib/payments/gateway-env";
import { newJuspayMerchantOrderRef } from "@/lib/payments/juspay-order-ref";
import { prisma } from "@/lib/prisma";
import { createRazorpayServerOrder } from "@/lib/razorpay/create-order";
import { siteUrl } from "@/lib/site";
import { getStripe, inrToStripeAmount } from "@/lib/stripe";
import { logPaymentFailure } from "@/lib/logger";
import { markCartsConvertedForEmail } from "@/lib/server/cart-recovery";
import { createCheckoutOrderSchema } from "@/lib/validations/api";

async function notifyCartConversion(orderId: string, email: string) {
  void markCartsConvertedForEmail(email, orderId);
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCheckoutOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const auth = await getOptionalAuth();

  const resolved = await resolveCheckoutCart(body.items);
  if (resolved instanceof NextResponse) return resolved;

  const { resolvedItems, total } = resolved;

  const baseData = {
    userId: auth?.userId ?? null,
    guestEmail: auth ? null : body.customerEmail,
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

  try {
    if (body.paymentChannel === "cod") {
      const order = await prisma.order.create({
        data: {
          ...baseData,
          paymentMethod: "cod",
        },
      });
      void notifyCartConversion(order.id, body.customerEmail);

      return NextResponse.json({
        mode: "cod",
        orderId: order.id,
        message:
          "Order recorded as cash on delivery. Our team will confirm availability and schedule dispatch.",
      });
    }

    if (body.paymentChannel === "stripe") {
      if (!isStripePaymentsConfigured()) {
        return NextResponse.json(
          { error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." },
          { status: 503 }
        );
      }

      const stripe = getStripe();

      const order = await prisma.order.create({
        data: {
          ...baseData,
          paymentMethod: "stripe",
        },
      });
      void notifyCartConversion(order.id, body.customerEmail);

      const base = siteUrl.replace(/\/$/, "");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: body.customerEmail,
        client_reference_id: order.id,
        metadata: {
          orderId: order.id,
        },
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
        return NextResponse.json(
          { error: "Stripe session did not return a checkout URL" },
          { status: 502 }
        );
      }

      return NextResponse.json({
        mode: "stripe",
        orderId: order.id,
        checkoutUrl: session.url,
      });
    }

    if (body.paymentChannel === "razorpay") {
      if (!isRazorpayConfigured()) {
        return NextResponse.json(
          { error: "Razorpay is not configured." },
          { status: 503 }
        );
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
      if (!keyId) {
        return NextResponse.json(
          {
            error:
              "Razorpay public key missing — set NEXT_PUBLIC_RAZORPAY_KEY_ID for Checkout.",
          },
          { status: 503 }
        );
      }

      const amountPaise = total * 100;
      if (!Number.isFinite(amountPaise) || amountPaise < 100) {
        return NextResponse.json(
          { error: "Order total too small for Razorpay (minimum ₹1)." },
          { status: 400 }
        );
      }

      const order = await prisma.order.create({
        data: {
          ...baseData,
          paymentMethod: "razorpay",
        },
      });
      void notifyCartConversion(order.id, body.customerEmail);

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

        return NextResponse.json({
          mode: "razorpay",
          orderId: order.id,
          razorpayOrderId: rz.id,
          amountPaise,
          currency: "INR",
          keyId,
          prefillEmail: body.customerEmail,
          prefillContact: body.customerPhone.replace(/\D/g, "").slice(-15),
        });
      } catch (e) {
        void logPaymentFailure(req, "Razorpay checkout start failed", {
          error: e,
          provider: "razorpay",
          orderId: order.id,
          userId: auth?.userId,
        });
        await prisma.order.delete({ where: { id: order.id } });
        return NextResponse.json(
          { error: "Could not start Razorpay checkout — try again." },
          { status: 502 }
        );
      }
    }

    if (body.paymentChannel === "juspay") {
      if (!isJuspayConfigured()) {
        return NextResponse.json({ error: "Juspay is not configured." }, { status: 503 });
      }

      const juspayRef = newJuspayMerchantOrderRef();
      const base = siteUrl.replace(/\/$/, "");

      const order = await prisma.order.create({
        data: {
          ...baseData,
          paymentMethod: "juspay",
          juspayCheckoutOrderRef: juspayRef,
        },
      });
      void notifyCartConversion(order.id, body.customerEmail);

      const routingId =
        auth?.userId ?? body.customerEmail.replace(/[^a-z0-9]/gi, "").slice(0, 48);

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
        void logPaymentFailure(req, "Juspay session failed", {
          provider: "juspay",
          orderId: order.id,
          userId: auth?.userId,
          meta: { error: session.error },
        });
        await prisma.order.delete({ where: { id: order.id } });
        return NextResponse.json({ error: session.error }, { status: 502 });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { juspayGatewayOrderId: session.gatewayOrderId },
      });

      return NextResponse.json({
        mode: "juspay",
        orderId: order.id,
        paymentLink: session.paymentLinkWeb,
      });
    }

    return NextResponse.json({ error: "Unsupported payment channel" }, { status: 400 });
  } catch (e) {
    void logPaymentFailure(req, "Order checkout failed", {
      error: e,
      userId: auth?.userId,
      meta: { channel: body.paymentChannel },
    });
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}
