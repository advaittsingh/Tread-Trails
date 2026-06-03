import type { Request, Response } from "express";
import { BookingStatus, type Prisma } from "@prisma/client";
import { z } from "zod";

import { studioTodayISO } from "../../lib/admin/booking-detail.js";
import {
  mapAdminBookingDetail,
  mapBookingTimeline,
} from "../../lib/admin/map-admin-booking.js";
import { statusTimestampPatch } from "../../lib/admin/booking-detail.js";
import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

const STATUS_VALUES = new Set<string>([
  BookingStatus.pending,
  BookingStatus.confirmed,
  BookingStatus.completed,
  BookingStatus.cancelled,
]);

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  adminNotes: z.string().max(8000).optional(),
});

export async function listBookings(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();
  const statusParam = String(req.query.status ?? "").trim();
  const view = String(req.query.view ?? "").trim();

  const where: Prisma.BookingWhereInput = {};
  const today = studioTodayISO();

  if (statusParam && STATUS_VALUES.has(statusParam)) {
    where.status = statusParam as BookingStatus;
  }

  switch (view) {
    case "today":
      where.date = today;
      where.status = { not: BookingStatus.cancelled };
      break;
    case "upcoming":
      where.date = { gte: today };
      where.status = { in: [BookingStatus.pending, BookingStatus.confirmed] };
      break;
    case "completed":
      where.status = BookingStatus.completed;
      break;
    case "cancelled":
      where.status = BookingStatus.cancelled;
      break;
    default:
      break;
  }

  if (search) {
    where.OR = [
      { contactEmail: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { contactPhone: { contains: search, mode: "insensitive" } },
      { vehicleName: { contains: search, mode: "insensitive" } },
      { service: { contains: search, mode: "insensitive" } },
      { id: { equals: search } },
    ];
  }

  const orderBy: Prisma.BookingOrderByWithRelationInput[] =
    view === "upcoming" || view === "today"
      ? [{ date: "asc" }, { time: "asc" }]
      : [{ createdAt: "desc" }];

  try {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({ where, orderBy, skip, take: limit }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        userId: b.userId ?? null,
        vehicleSlug: b.vehicleSlug,
        contactEmail: b.contactEmail,
        contactName: b.contactName,
        contactPhone: b.contactPhone,
        customerMessage: b.customerMessage,
        vehicleName: b.vehicleName,
        service: b.service,
        date: b.date,
        time: b.time,
        status: b.status,
        createdAt: b.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      studioToday: today,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load bookings" });
  }
}

export async function getBooking(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: "Not found" });
    }

    const auditLog = await prisma.adminAuditLog.findMany({
      where: { entity: "booking", entityId: booking.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        action: true,
        meta: true,
        createdAt: true,
      },
    });

    const timeline = mapBookingTimeline(booking);
    for (const entry of auditLog) {
      if (entry.action === "booking.status_update") {
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

    return res.json({
      booking: mapAdminBookingDetail(booking),
      timeline,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load booking" });
  }
}

export async function patchBooking(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  if (
    parsed.data.status === undefined &&
    parsed.data.adminNotes === undefined
  ) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const prev = await prisma.booking.findUnique({ where: { id } });
    if (!prev) {
      return res.status(404).json({ error: "Not found" });
    }

    const nextStatus = parsed.data.status;
    const timestampPatch =
      nextStatus !== undefined
        ? statusTimestampPatch(nextStatus, prev)
        : {};

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
        ...(parsed.data.adminNotes !== undefined
          ? { adminNotes: parsed.data.adminNotes }
          : {}),
        ...timestampPatch,
      },
    });

    const aid = adminId(req);

    if (nextStatus !== undefined && nextStatus !== prev.status) {
      await logAdminAction({
        adminId: aid,
        action: "booking.status_update",
        entity: "booking",
        entityId: id,
        meta: { from: prev.status, to: nextStatus },
      });
    }
    if (
      parsed.data.adminNotes !== undefined &&
      parsed.data.adminNotes !== prev.adminNotes
    ) {
      await logAdminAction({
        adminId: aid,
        action: "booking.notes_update",
        entity: "booking",
        entityId: id,
      });
    }

    return res.json({
      booking: mapAdminBookingDetail(booking),
      timeline: mapBookingTimeline(booking),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}
