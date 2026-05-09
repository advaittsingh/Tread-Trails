import { z } from "zod";

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
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  region: z.string().min(1).max(120),
  postal: z.string().min(1).max(32),
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
  customerEmail: z.string().email(),
  shippingAddress: addressSchema,
  /** Client radios: UPI/card route through Stripe Checkout; COD stays pending for manual confirmation */
  paymentChannel: z.enum(["stripe", "cod"]),
  items: z.array(orderLineSchema).min(1),
});

export const bookingCreateSchema = z.object({
  vehicleSlug: z.string().min(1),
  vehicleName: z.string().min(1),
  service: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6).max(32),
});
