import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "cancelled"]).optional(),
  fulfilmentNotes: z.string().max(8000).optional(),
});

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const order = await prisma.order.findUnique({
    where: { id: context.params.id },
  });
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      userId: order.userId,
      guestEmail: order.guestEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      items: order.items,
      total: order.total,
      currency: order.currency,
      status: order.status,
      paymentMethod: order.paymentMethod,
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      juspayGatewayOrderId: order.juspayGatewayOrderId,
      juspayCheckoutOrderRef: order.juspayCheckoutOrderRef,
      fulfilmentNotes: order.fulfilmentNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  });
}

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { id } = context.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.status === undefined && parsed.data.fulfilmentNotes === undefined) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const prev = await prisma.order.findUnique({ where: { id } });
    if (!prev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined
          ? { status: parsed.data.status }
          : {}),
        ...(parsed.data.fulfilmentNotes !== undefined
          ? { fulfilmentNotes: parsed.data.fulfilmentNotes }
          : {}),
      },
    });

    if (parsed.data.status !== undefined && parsed.data.status !== prev.status) {
      await logAdminAction({
        adminId: gate.auth.userId,
        action: "order.status_update",
        entity: "order",
        entityId: id,
        meta: { from: prev.status, to: parsed.data.status },
      });
    }
    if (
      parsed.data.fulfilmentNotes !== undefined &&
      parsed.data.fulfilmentNotes !== prev.fulfilmentNotes
    ) {
      await logAdminAction({
        adminId: gate.auth.userId,
        action: "order.notes_update",
        entity: "order",
        entityId: id,
      });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        fulfilmentNotes: order.fulfilmentNotes,
      },
    });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
