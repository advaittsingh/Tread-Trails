import { NextResponse } from "next/server";

import { getOptionalAuth } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { unitPriceForVariant } from "@/lib/order/server-pricing";
import { siteUrl } from "@/lib/site";
import { getStripe, inrToStripeAmount } from "@/lib/stripe";
import { createCheckoutOrderSchema } from "@/lib/validations/api";

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

  try {
    await connectDB();

    const slugs = Array.from(new Set(body.items.map((i) => i.productSlug)));
    const products = await Product.find({ slug: { $in: slugs } }).lean();
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    const resolvedItems: {
      productSlug: string;
      variantId: string;
      variantLabel: string;
      name: string;
      image: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const line of body.items) {
      const p = bySlug.get(line.productSlug);
      if (!p) {
        return NextResponse.json(
          { error: `Unknown product: ${line.productSlug}` },
          { status: 400 }
        );
      }
      const unit = unitPriceForVariant(p, line.variantId);
      if (unit == null) {
        return NextResponse.json(
          { error: `Product "${p.name}" is price-on-application — remove it or contact concierge.` },
          { status: 400 }
        );
      }
      resolvedItems.push({
        productSlug: p.slug,
        variantId: line.variantId,
        variantLabel: line.variantLabel,
        name: p.name,
        image: line.image ?? p.images?.[0] ?? "",
        quantity: line.quantity,
        unitPrice: unit,
      });
    }

    const total = resolvedItems.reduce(
      (sum, l) => sum + l.unitPrice * l.quantity,
      0
    );

    if (body.paymentChannel === "cod") {
      const order = await Order.create({
        userId: auth?.userId,
        guestEmail: auth ? undefined : body.customerEmail,
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
        status: "pending",
        paymentMethod: "cod",
      });

      return NextResponse.json({
        mode: "cod",
        orderId: order._id.toString(),
        message:
          "Order recorded as cash on delivery. Our team will confirm availability and schedule dispatch.",
      });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Online payments are not configured (missing STRIPE_SECRET_KEY)." },
        { status: 503 }
      );
    }

    const stripe = getStripe();

    const order = await Order.create({
      userId: auth?.userId,
      guestEmail: auth ? undefined : body.customerEmail,
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
      status: "pending",
      paymentMethod: "stripe",
    });

    const base = siteUrl.replace(/\/$/, "");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.customerEmail,
      client_reference_id: order._id.toString(),
      metadata: {
        orderId: order._id.toString(),
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

    order.stripeCheckoutSessionId = session.id;
    await order.save();

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session did not return a checkout URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      mode: "stripe",
      orderId: order._id.toString(),
      checkoutUrl: session.url,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}
