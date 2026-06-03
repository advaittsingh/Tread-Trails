import type { Request, Response } from "express";
import { OrderStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import {
  mapAdminOrderDetail,
  mapOrderTimeline,
} from "../../lib/admin/map-admin-order.js";
import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { extractChange } from "../../lib/admin/audit-diff.js";
import type { OrderListFilters } from "../../lib/admin/order-list.js";
import { prisma } from "../../lib/prisma.js";
import {
  buildOrdersWhere,
  getAdminOrderDetailBundle,
  getOrdersSummary,
  listAdminOrders,
  ordersToCsv,
} from "../../services/admin/orders-admin.service.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

const patchSchema = z.object({
  status: z
    .enum(["pending", "paid", "packed", "shipped", "delivered", "cancelled"])
    .optional(),
  fulfilmentNotes: z.string().max(8000).optional(),
  trackingNumber: z.string().max(120).nullable().optional(),
  shippingCarrier: z.string().max(120).nullable().optional(),
});

const noteSchema = z.object({
  body: z.string().min(1).max(8000),
});

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(["pending", "paid", "packed", "shipped", "delivered", "cancelled"]),
  shippingCarrier: z.string().max(120).optional(),
});

function statusTimestampPatch(
  nextStatus: string,
  prev: {
    paidAt: Date | null;
    packedAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
  }
) {
  const now = new Date();
  const patch: {
    paidAt?: Date;
    packedAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
  } = {};

  if (nextStatus === "paid" && !prev.paidAt) patch.paidAt = now;
  if (nextStatus === "packed" && !prev.packedAt) patch.packedAt = now;
  if (nextStatus === "shipped" && !prev.shippedAt) patch.shippedAt = now;
  if (nextStatus === "delivered" && !prev.deliveredAt) patch.deliveredAt = now;
  if (nextStatus === "cancelled" && !prev.cancelledAt) patch.cancelledAt = now;

  return patch;
}

function parseListFilters(req: Request): OrderListFilters {
  return {
    search: String(req.query.search ?? "").trim() || undefined,
    customerName: String(req.query.customerName ?? "").trim() || undefined,
    status: String(req.query.status ?? "").trim() || undefined,
    payment: String(req.query.payment ?? "").trim() || undefined,
    paymentStatus: String(req.query.paymentStatus ?? "").trim() || undefined,
    phone: String(req.query.phone ?? "").trim() || undefined,
    vehicle: String(req.query.vehicle ?? "").trim() || undefined,
    brand: String(req.query.brand ?? "").trim() || undefined,
    dateFrom: String(req.query.dateFrom ?? "").trim() || undefined,
    dateTo: String(req.query.dateTo ?? "").trim() || undefined,
  };
}

export async function getOrdersSummaryHandler(_req: Request, res: Response) {
  try {
    const summary = await getOrdersSummary();
    res.setHeader("Cache-Control", "private, max-age=15");
    return res.json(summary);
  } catch (e) {
    console.error("[admin/orders/summary]", e);
    return res.status(500).json({ error: "Failed to load order summary" });
  }
}

export async function listOrders(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);

  try {
    const where = await buildOrdersWhere(parseListFilters(req));
    const { orders, total } = await listAdminOrders(where, skip, limit);

    return res.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load orders" });
  }
}

export async function exportOrders(req: Request, res: Response) {
  try {
    const where = await buildOrdersWhere(parseListFilters(req));
    const { orders } = await listAdminOrders(where, 0, 5000);
    const csv = ordersToCsv(orders);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tread-trails-orders-${Date.now()}.csv"`
    );
    return res.send(csv);
  } catch (e) {
    console.error("[admin/orders/export]", e);
    return res.status(500).json({ error: "Export failed" });
  }
}

export async function bulkPatchOrders(req: AuthedRequest, res: Response) {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const aid = adminId(req);
  const { ids, status, shippingCarrier } = parsed.data;

  try {
    const updated: string[] = [];
    for (const id of ids) {
      const prev = await prisma.order.findUnique({ where: { id } });
      if (!prev) continue;

      const order = await prisma.order.update({
        where: { id },
        data: {
          status,
          ...(shippingCarrier !== undefined ? { shippingCarrier } : {}),
          ...statusTimestampPatch(status, prev),
        },
      });
      updated.push(order.id);

      await logAdminAction({
        adminId: aid,
        action: "order.bulk_status_update",
        entity: "order",
        entityId: id,
        newValue: { status, shippingCarrier },
      });
    }

    return res.json({ updated, count: updated.length });
  } catch (e) {
    console.error("[admin/orders/bulk]", e);
    return res.status(500).json({ error: "Bulk update failed" });
  }
}

export async function getOrder(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const bundle = await getAdminOrderDetailBundle(id);
    if (!bundle) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(bundle);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load order" });
  }
}

export async function patchOrder(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const hasUpdate = Object.values(parsed.data).some((v) => v !== undefined);
  if (!hasUpdate) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const prev = await prisma.order.findUnique({ where: { id } });
    if (!prev) {
      return res.status(404).json({ error: "Not found" });
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

    const aid = adminId(req);

    const orderChange = extractChange(
      {
        status: prev.status,
        fulfilmentNotes: prev.fulfilmentNotes,
        trackingNumber: prev.trackingNumber,
        shippingCarrier: prev.shippingCarrier,
      },
      parsed.data as Record<string, unknown>
    );

    if (orderChange) {
      await logAdminAction({
        adminId: aid,
        action: "order.update",
        entity: "order",
        entityId: id,
        previousValue: orderChange.previousValue,
        newValue: orderChange.newValue,
      });
    }

    return res.json({
      order: mapAdminOrderDetail(order),
      timeline: mapOrderTimeline(order),
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function addOrderNote(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: "Not found" });
    }

    const note = await prisma.orderInternalNote.create({
      data: {
        orderId: id,
        adminId: adminId(req),
        body: parsed.data.body,
      },
      include: { admin: { select: { name: true } } },
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "order.note_added",
      entity: "order",
      entityId: id,
    });

    return res.json({
      note: {
        id: note.id,
        body: note.body,
        adminName: note.admin?.name ?? null,
        createdAt: note.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to add note" });
  }
}
