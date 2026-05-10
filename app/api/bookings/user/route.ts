import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: gate.auth.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        service: true,
        vehicleName: true,
        date: true,
        time: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        service: b.service,
        vehicleName: b.vehicleName,
        date: b.date,
        time: b.time,
        status: b.status,
        createdAt: b.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
