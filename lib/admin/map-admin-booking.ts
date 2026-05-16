import type { Booking } from "@prisma/client";

import {
  buildBookingTimeline,
  type AdminBookingDetail,
  type BookingTimelineEvent,
} from "@/lib/admin/booking-detail";

export function mapAdminBookingDetail(booking: Booking): AdminBookingDetail {
  return {
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
    customerMessage: booking.customerMessage,
    adminNotes: booking.adminNotes,
    status: booking.status,
    confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    completedAt: booking.completedAt?.toISOString() ?? null,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export function mapBookingTimeline(booking: Booking): BookingTimelineEvent[] {
  return buildBookingTimeline(booking);
}
