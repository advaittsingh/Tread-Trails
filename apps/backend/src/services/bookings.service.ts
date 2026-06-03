import type { z } from "zod";

import { prisma } from "../lib/prisma.js";
import type { bookingCreateSchema } from "../validators/storefront.validators.js";

type BookingBody = z.infer<typeof bookingCreateSchema>;

export const bookingsService = {
  async create(body: BookingBody, userId: string | null) {
    const booking = await prisma.booking.create({
      data: {
        userId,
        vehicleSlug: body.vehicleSlug,
        vehicleName: body.vehicleName,
        service: body.service,
        date: body.date,
        time: body.time,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        customerMessage: body.customerMessage?.trim() ?? "",
        status: "pending",
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

    return {
      booking: { id: booking.id, status: booking.status },
    };
  },

  async listForUser(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
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

    return bookings.map((b) => ({
      id: b.id,
      service: b.service,
      vehicleName: b.vehicleName,
      date: b.date,
      time: b.time,
      status: b.status,
      createdAt: b.createdAt,
    }));
  },
};
