import type { Brand as BrandRow } from "@prisma/client";

export type BrandEntry = {
  name: string;
  slug: string;
  productCount: number;
  tagline?: string;
  logoSrc?: string;
};

export function prismaBrandToBrandEntry(b: BrandRow): BrandEntry {
  return {
    name: b.name,
    slug: b.slug,
    productCount: b.productCount,
    ...(b.tagline ? { tagline: b.tagline } : {}),
    ...(b.logoSrc ? { logoSrc: b.logoSrc } : {}),
  };
}
