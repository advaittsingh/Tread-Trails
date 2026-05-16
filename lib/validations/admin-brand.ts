import { z } from "zod";

export const adminBrandCreateSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  tagline: z.string().max(500).optional().default(""),
  logoSrc: z.string().max(2000).optional().default(""),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
});

export const adminBrandPatchSchema = adminBrandCreateSchema.partial().strict();
