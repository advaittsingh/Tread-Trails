import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();
  const statusParam = searchParams.get("status")?.trim();

  const where: Prisma.BookingWhereInput = {};
  if (
    statusParam === BookingStatus.requested ||
    statusParam === BookingStatus.confirmed ||
    statusParam === BookingStatus.cancelled
  ) {
    where.status = statusParam;
  }
  if (search) {
    where.OR = [
      { contactEmail: { contains: search, mode: "insensitive" } },
      { vehicleName: { contains: search, mode: "insensitive" } },
      { service: { contains: search, mode: "insensitive" } },
      { id: { equals: search } },
    ];
  }

  try {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        userId: b.userId ?? null,
        contactEmail: b.contactEmail,
        contactName: b.contactName,
        contactPhone: b.contactPhone,
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
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
