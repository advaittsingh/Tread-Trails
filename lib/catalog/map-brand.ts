import type { BrandEntry } from "@/data/index";
import type { Brand as BrandRow } from "@prisma/client";

export function prismaBrandToBrandEntry(b: BrandRow): BrandEntry {
  return {
    name: b.name,
    slug: b.slug,
    productCount: b.productCount,
    ...(b.tagline ? { tagline: b.tagline } : {}),
    ...(b.logoSrc ? { logoSrc: b.logoSrc } : {}),
  };
}
