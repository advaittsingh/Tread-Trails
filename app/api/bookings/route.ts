import { NextResponse } from "next/server";

import { getOptionalAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";
import { bookingCreateSchema } from "@/lib/validations/api";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const auth = await getOptionalAuth();

  try {
    const booking = await prisma.booking.create({
      data: {
        userId: auth?.userId ?? null,
        vehicleSlug: body.vehicleSlug,
        vehicleName: body.vehicleName,
        service: body.service,
        date: body.date,
        time: body.time,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        status: "requested",
      },
    });

    console.info("[booking] created", {
      id: booking.id,
      service: body.service,
      vehicle: body.vehicleName,
      date: body.date,
      time: body.time,
      email: body.contactEmail,
    });

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save booking" }, { status: 500 });
  }
}
