import type { Booking } from "@prisma/client";

import { bookingStudioClockContextServer, studioCalendarTodayISO } from "@/lib/booking/slots";

export type BookingTimelineEvent = {
  id: string;
  kind: "requested" | "confirmed" | "completed" | "cancelled" | "admin";
  title: string;
  detail?: string;
  at: string;
};

export type AdminBookingDetail = {
  id: string;
  userId: string | null;
  vehicleSlug: string;
  vehicleName: string;
  service: string;
  date: string;
  time: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  customerMessage: string;
  adminNotes: string;
  status: string;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function studioTodayISO(): string {
  const { utcOffsetMinutes } = bookingStudioClockContextServer();
  return studioCalendarTodayISO(new Date(), utcOffsetMinutes);
}

export function buildBookingTimeline(booking: Booking): BookingTimelineEvent[] {
  const events: BookingTimelineEvent[] = [
    {
      id: "placed",
      kind: "requested",
      title: "Booking requested",
      detail: `${booking.service} · ${booking.vehicleName}`,
      at: booking.createdAt.toISOString(),
    },
  ];

  if (booking.confirmedAt || booking.status === "confirmed") {
    events.push({
      id: "confirmed",
      kind: "confirmed",
      title: "Bay confirmed",
      at: (booking.confirmedAt ?? booking.updatedAt).toISOString(),
    });
  }

  if (booking.completedAt || booking.status === "completed") {
    events.push({
      id: "completed",
      kind: "completed",
      title: "Visit completed",
      at: (booking.completedAt ?? booking.updatedAt).toISOString(),
    });
  }

  if (booking.cancelledAt || booking.status === "cancelled") {
    events.push({
      id: "cancelled",
      kind: "cancelled",
      title: "Booking cancelled",
      at: (booking.cancelledAt ?? booking.updatedAt).toISOString(),
    });
  }

  return events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
}

export function statusTimestampPatch(
  nextStatus: string,
  prev: Pick<Booking, "confirmedAt" | "completedAt" | "cancelledAt">
) {
  const now = new Date();
  const patch: {
    confirmedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  } = {};

  if (nextStatus === "confirmed" && !prev.confirmedAt) patch.confirmedAt = now;
  if (nextStatus === "completed" && !prev.completedAt) patch.completedAt = now;
  if (nextStatus === "cancelled" && !prev.cancelledAt) patch.cancelledAt = now;

  return patch;
}
