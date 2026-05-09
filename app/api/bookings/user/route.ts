import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { Booking } from "@/lib/models/Booking";

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  try {
    await connectDB();
    const bookings = await Booking.find({ userId: gate.auth.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b._id.toString(),
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
