import { z } from "zod";

/** Body for `POST /api/admin/portfolio-builds` */
export const adminPortfolioBuildCreateSchema = z.object({
  slug: z.string().min(1).max(320),
  title: z.string().min(1).max(500),
  vehicleSlug: z.string().min(1).max(120),
  summary: z.string().max(10000).optional().default(""),
  description: z.string().max(50000).optional().default(""),
  beforeImage: z.string().min(1).max(2000),
  afterImage: z.string().min(1).max(2000),
  gallery: z.array(z.string()).max(50).optional().default([]),
  /** Product slug, internal id, or legacyId — order preserved; duplicates collapsed */
  productIds: z.array(z.string().min(1)).max(80).optional().default([]),
  legacyId: z.string().max(120).nullable().optional(),
  homeSpotlightRank: z.number().int().min(0).max(999).nullable().optional(),
});

/** Body for `PATCH /api/admin/portfolio-builds/[id]` */
export const adminPortfolioBuildPatchSchema = z
  .object({
    slug: z.string().min(1).max(320).optional(),
    title: z.string().min(1).max(500).optional(),
    vehicleSlug: z.string().min(1).max(120).optional(),
    summary: z.string().max(10000).optional(),
    description: z.string().max(50000).optional(),
    beforeImage: z.string().min(1).max(2000).optional(),
    afterImage: z.string().min(1).max(2000).optional(),
    gallery: z.array(z.string()).max(50).optional(),
    productIds: z.array(z.string().min(1)).max(80).optional(),
    legacyId: z.string().max(120).nullable().optional(),
    homeSpotlightRank: z.number().int().min(0).max(999).nullable().optional(),
  })
  .strict();

export type AdminPortfolioBuildCreateInput = z.infer<
  typeof adminPortfolioBuildCreateSchema
>;
export type AdminPortfolioBuildPatchInput = z.infer<
  typeof adminPortfolioBuildPatchSchema
>;
