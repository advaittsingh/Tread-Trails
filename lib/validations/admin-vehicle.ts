import { z } from "zod";

import { VEHICLE_CATEGORY_ORDER } from "@/lib/vehicle-categories";

const categorySchema = z.enum(VEHICLE_CATEGORY_ORDER);

export const adminVehicleCreateSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  tagline: z.string().max(500).optional().default(""),
  description: z.string().max(20000).optional().default(""),
  heroImage: z.string().min(1).max(2000),
  thumbnail: z.string().min(1).max(2000),
  category: categorySchema,
  engineSummary: z.string().max(2000).optional().default(""),
  modelYearsLabel: z.string().max(500).optional().default(""),
  trimSummary: z.string().max(2000).optional().default(""),
  legacyId: z.string().max(120).nullable().optional(),
});

export const adminVehiclePatchSchema = adminVehicleCreateSchema.partial().strict();
