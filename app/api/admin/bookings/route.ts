import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { Booking } from "@/lib/models/Booking";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { contactEmail: { $regex: search, $options: "i" } },
      { vehicleName: { $regex: search, $options: "i" } },
      { service: { $regex: search, $options: "i" } },
    ];
  }

  try {
    await connectDB();
    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Booking.countDocuments(filter),
    ]);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b._id.toString(),
        userId: b.userId ? String(b.userId) : null,
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
