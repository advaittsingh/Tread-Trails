import { z } from "zod";

/** Matches `ProductSpecification` / persisted `Product.specs` JSON rows. */
const specSchema = z.object({
  label: z.string(),
  value: z.string(),
});

/** Matches `ProductVariant` / persisted `Product.variants` JSON rows. */
const variantSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  priceModifier: z.number().optional(),
});

/** Body for `POST /api/admin/products` */
export const adminProductCreateSchema = z.object({
  slug: z.string().min(1).max(320),
  name: z.string().min(1).max(500),
  brand: z.string().min(1).max(200),
  category: z.string().min(1).max(120),
  price: z.number().int().min(0).nullable().optional(),
  currency: z.string().min(1).max(12).optional().default("INR"),
  images: z.array(z.string()).max(50).optional().default([]),
  description: z.string().max(50000).optional().default(""),
  specs: z.array(specSchema).optional().default([]),
  variants: z.array(variantSchema).optional(),
  legacyId: z.string().max(120).nullable().optional(),
  /** Platform slugs; must exist on `Vehicle`. Replaces none until persist helper runs. */
  vehicleSlugs: z.array(z.string().min(1)).max(32).optional().default([]),
});

/** Body for `PATCH /api/admin/products/[id]` — omit fields to leave unchanged. */
export const adminProductPatchSchema = z
  .object({
    slug: z.string().min(1).max(320).optional(),
    name: z.string().min(1).max(500).optional(),
    brand: z.string().min(1).max(200).optional(),
    category: z.string().min(1).max(120).optional(),
    price: z.number().int().min(0).nullable().optional(),
    currency: z.string().min(1).max(12).optional(),
    images: z.array(z.string()).max(50).optional(),
    description: z.string().max(50000).optional(),
    specs: z.array(specSchema).optional(),
    variants: z.array(variantSchema).nullable().optional(),
    legacyId: z.string().max(120).nullable().optional(),
    /** If key present (including `[]`), replaces join rows for this product. */
    vehicleSlugs: z.array(z.string().min(1)).max(32).optional(),
  })
  .strict();

export type AdminProductCreateInput = z.infer<typeof adminProductCreateSchema>;
export type AdminProductPatchInput = z.infer<typeof adminProductPatchSchema>;
