import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { mapAdminOrderDetail, mapOrderTimeline } from "@/lib/admin/map-admin-order";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z
    .enum(["pending", "paid", "shipped", "delivered", "cancelled"])
    .optional(),
  fulfilmentNotes: z.string().max(8000).optional(),
  trackingNumber: z.string().max(120).nullable().optional(),
  shippingCarrier: z.string().max(120).nullable().optional(),
});

function statusTimestampPatch(
  nextStatus: string,
  prev: {
    paidAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
  }
) {
  const now = new Date();
  const patch: {
    paidAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
  } = {};

  if (nextStatus === "paid" && !prev.paidAt) patch.paidAt = now;
  if (nextStatus === "shipped" && !prev.shippedAt) patch.shippedAt = now;
  if (nextStatus === "delivered" && !prev.deliveredAt) patch.deliveredAt = now;
  if (nextStatus === "cancelled" && !prev.cancelledAt) patch.cancelledAt = now;

  return patch;
}

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const order = await prisma.order.findUnique({
      where: { id: context.params.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const auditLog = await prisma.adminAuditLog.findMany({
      where: { entity: "order", entityId: order.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        meta: true,
        createdAt: true,
        adminId: true,
      },
    });

    const timeline = mapOrderTimeline(order);

    for (const entry of auditLog) {
      if (entry.action === "order.status_update") {
        const meta = entry.meta as { from?: string; to?: string } | null;
        timeline.push({
          id: `audit-${entry.id}`,
          kind: "admin",
          title: `Status: ${meta?.from ?? "?"} → ${meta?.to ?? "?"}`,
          detail: "Admin update",
          at: entry.createdAt.toISOString(),
        });
      }
    }

    timeline.sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
    );

    return NextResponse.json({
      order: mapAdminOrderDetail(order),
      timeline,
      auditLog: auditLog.map((a) => ({
        id: a.id,
        action: a.action,
        meta: a.meta,
        adminId: a.adminId,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
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

  const hasUpdate = Object.values(parsed.data).some((v) => v !== undefined);
  if (!hasUpdate) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const prev = await prisma.order.findUnique({ where: { id } });
    if (!prev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextStatus = parsed.data.status;
    const timestampPatch =
      nextStatus !== undefined
        ? statusTimestampPatch(nextStatus, prev)
        : {};

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
        ...(parsed.data.fulfilmentNotes !== undefined
          ? { fulfilmentNotes: parsed.data.fulfilmentNotes }
          : {}),
        ...(parsed.data.trackingNumber !== undefined
          ? { trackingNumber: parsed.data.trackingNumber }
          : {}),
        ...(parsed.data.shippingCarrier !== undefined
          ? { shippingCarrier: parsed.data.shippingCarrier }
          : {}),
        ...timestampPatch,
      },
    });

    if (nextStatus !== undefined && nextStatus !== prev.status) {
      await logAdminAction({
        adminId: gate.auth.userId,
        action: "order.status_update",
        entity: "order",
        entityId: id,
        meta: { from: prev.status, to: nextStatus },
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
    if (
      parsed.data.trackingNumber !== undefined &&
      parsed.data.trackingNumber !== prev.trackingNumber
    ) {
      await logAdminAction({
        adminId: gate.auth.userId,
        action: "order.tracking_update",
        entity: "order",
        entityId: id,
        meta: {
          trackingNumber: parsed.data.trackingNumber,
          shippingCarrier: parsed.data.shippingCarrier ?? prev.shippingCarrier,
        },
      });
    } else if (
      parsed.data.shippingCarrier !== undefined &&
      parsed.data.shippingCarrier !== prev.shippingCarrier
    ) {
      await logAdminAction({
        adminId: gate.auth.userId,
        action: "order.tracking_update",
        entity: "order",
        entityId: id,
        meta: { shippingCarrier: parsed.data.shippingCarrier },
      });
    }

    return NextResponse.json({
      order: mapAdminOrderDetail(order),
      timeline: mapOrderTimeline(order),
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
