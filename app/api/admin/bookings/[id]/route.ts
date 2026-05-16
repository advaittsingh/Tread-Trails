import { NextResponse } from "next/server";
import { z } from "zod";

import { mapAdminBookingDetail, mapBookingTimeline } from "@/lib/admin/map-admin-booking";
import { statusTimestampPatch } from "@/lib/admin/booking-detail";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  adminNotes: z.string().max(8000).optional(),
});

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: context.params.id },
    });
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    return NextResponse.json({
      booking: mapAdminBookingDetail(booking),
      timeline,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load booking" }, { status: 500 });
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

  if (
    parsed.data.status === undefined &&
    parsed.data.adminNotes === undefined
  ) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const prev = await prisma.booking.findUnique({ where: { id } });
    if (!prev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    if (nextStatus !== undefined && nextStatus !== prev.status) {
      await logAdminAction({
        adminId: gate.auth.userId,
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
        adminId: gate.auth.userId,
        action: "booking.notes_update",
        entity: "booking",
        entityId: id,
      });
    }

    return NextResponse.json({
      booking: mapAdminBookingDetail(booking),
      timeline: mapBookingTimeline(booking),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
