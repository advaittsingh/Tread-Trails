import {
  prismaBrandToBrandEntry,
  type BrandEntry,
} from "../../lib/catalog/map-brand.js";
import { loadStaticBrandEntries } from "../../lib/static-data.js";
import { prisma } from "../../lib/prisma.js";

function brandToPayload(b: BrandEntry) {
  return {
    name: b.name,
    slug: b.slug,
    productCount: b.productCount,
    ...(b.tagline != null ? { tagline: b.tagline } : {}),
    ...(b.logoSrc != null ? { logoSrc: b.logoSrc } : {}),
  };
}

export const brandsService = {
  brandToPayload,

  async getBySlug(slug: string): Promise<{ brand: ReturnType<typeof brandToPayload> } | null> {
    const trimmed = slug.trim();
    if (!trimmed) return null;

    try {
      const row = await prisma.brand.findUnique({ where: { slug: trimmed } });
      if (row) {
        return { brand: brandToPayload(prismaBrandToBrandEntry(row)) };
      }
    } catch {
      /* ignore */
    }

    const staticBrands = await loadStaticBrandEntries();
    const fallback = staticBrands.find((b) => b.slug === trimmed);
    if (fallback) return { brand: brandToPayload(fallback) };
    return null;
  },

  async list(): Promise<ReturnType<typeof brandToPayload>[]> {
    try {
      const rows = await prisma.brand.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
      if (rows.length > 0) {
        return rows.map((r) => brandToPayload(prismaBrandToBrandEntry(r)));
      }
    } catch {
      /* ignore */
    }

    const staticBrands = await loadStaticBrandEntries();
    return staticBrands.map(brandToPayload);
  },
};
