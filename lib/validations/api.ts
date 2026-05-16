import { z } from "zod";

import { phoneSchema } from "@/lib/validations/phone";

import {
  BOOKING_TIME_SLOTS,
  bookingSlotErrorMessage,
  bookingStudioClockContextServer,
  validateBookingSlot,
} from "@/lib/booking/slots";

const bookingTimeEnum = z.enum(BOOKING_TIME_SLOTS);

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const addressSchema = z.object({
  line1: z.string().trim().min(1, "Address is required").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, "City is required").max(120),
  region: z.string().trim().min(1, "State / region is required").max(120),
  postal: z.string().trim().min(1, "Postal code is required").max(32),
});

const orderLineSchema = z.object({
  productSlug: z.string().min(1),
  variantId: z.string().min(1),
  variantLabel: z.string().min(1),
  name: z.string().min(1),
  image: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
});

export const createCheckoutOrderSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(6).max(32),
  customerEmail: z.string().trim().email("Enter a valid email address"),
  shippingAddress: addressSchema,
  /** Online PSP selection — Stripe Checkout, Razorpay Checkout, Juspay hosted page, or COD */
  paymentChannel: z.enum(["stripe", "razorpay", "juspay", "cod"]),
  items: z.array(orderLineSchema).min(1),
});

export const bookingCreateSchema = z
  .object({
    vehicleSlug: z.string().min(1),
    vehicleName: z.string().min(1),
    service: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    time: bookingTimeEnum,
    contactName: z.string().trim().min(1, "Name is required").max(120),
    contactEmail: z.string().trim().email("Enter a valid email address"),
    contactPhone: phoneSchema,
    customerMessage: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const { utcOffsetMinutes } = bookingStudioClockContextServer();
    const issue = validateBookingSlot(data.date, data.time, { utcOffsetMinutes });
    if (!issue) return;
    ctx.addIssue({
      code: "custom",
      message: bookingSlotErrorMessage(issue),
      path: issue === "invalid_time" ? ["time"] : ["date"],
    });
  });
