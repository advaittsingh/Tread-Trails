import { z } from "zod";

export const vehicleMakeCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase slug format"),
  name: z.string().min(1).max(120),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
});

export const vehicleMakePatchSchema = vehicleMakeCreateSchema.partial().strict();

export const vehicleModelCreateSchema = z.object({
  makeId: z.string().cuid(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(120),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
});

export const vehicleModelPatchSchema = vehicleModelCreateSchema
  .omit({ makeId: true })
  .partial()
  .strict();
