import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["requested", "confirmed", "cancelled"]),
});

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const booking = await prisma.booking.findUnique({
    where: { id: context.params.id },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      userId: booking.userId,
      vehicleSlug: booking.vehicleSlug,
      vehicleName: booking.vehicleName,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      contactPhone: booking.contactPhone,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
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

  try {
    const prev = await prisma.booking.findUnique({ where: { id } });
    if (!prev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "booking.status_update",
      entity: "booking",
      entityId: id,
      meta: { from: prev.status, to: parsed.data.status },
    });

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
