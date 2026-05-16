import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";

import { studioTodayISO } from "@/lib/admin/booking-detail";
import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

const STATUS_VALUES = new Set<string>([
  BookingStatus.pending,
  BookingStatus.confirmed,
  BookingStatus.completed,
  BookingStatus.cancelled,
]);

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();
  const statusParam = searchParams.get("status")?.trim();
  const view = searchParams.get("view")?.trim();

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
      prisma.booking.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
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
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
