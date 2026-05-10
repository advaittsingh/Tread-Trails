import { ADVVEN_PARTNER_BRANDS, productBelongsToPartnerSlug } from "@/data/advven-brands";
import type { BrandEntry } from "@/data/index";
import { products as staticProducts } from "@/data/products";
import type { Product } from "@/data/types";
import { prismaBrandToBrandEntry } from "@/lib/catalog/map-brand";
import { prisma } from "@/lib/prisma";

function staticBrandEntries(): BrandEntry[] {
  return ADVVEN_PARTNER_BRANDS.map((b) => ({
    name: b.name,
    slug: b.slug,
    productCount: staticProducts.filter((p) =>
      productBelongsToPartnerSlug(p, b.slug)
    ).length,
    tagline: b.tagline,
    logoSrc: b.logoSrc,
  }));
}

/** Partner brands from Neon when seeded; otherwise static Advven lineup + counts. */
export async function listBrandEntries(): Promise<BrandEntry[]> {
  try {
    const rows = await prisma.brand.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    if (rows.length > 0) return rows.map(prismaBrandToBrandEntry);
  } catch {
    /* DATABASE_URL missing / unreachable */
  }
  return staticBrandEntries();
}

export async function getBrandBySlug(slug: string): Promise<BrandEntry | null> {
  try {
    const row = await prisma.brand.findUnique({ where: { slug } });
    if (row) return prismaBrandToBrandEntry(row);
  } catch {
    /* ignore */
  }
  return staticBrandEntries().find((b) => b.slug === slug) ?? null;
}

export async function listBrandSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.brand.findMany({
      select: { slug: true },
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    });
    if (rows.length > 0) return rows.map((r) => r.slug);
  } catch {
    /* ignore */
  }
  return ADVVEN_PARTNER_BRANDS.map((b) => b.slug);
}

/** Recompute `productCount` from DB rows using the same partner-slug rules as the static catalog. */
export async function recountBrandProductCountsFromDb(): Promise<void> {
  const rows = await prisma.product.findMany({
    select: { name: true, brand: true, description: true },
  });
  const minimalProducts = rows.map(
    (r) =>
      ({
        name: r.name,
        brand: r.brand,
        description: r.description,
      }) as Product
  );

  const brands = await prisma.brand.findMany();
  for (const b of brands) {
    const productCount = minimalProducts.filter((p) =>
      productBelongsToPartnerSlug(p, b.slug)
    ).length;
    await prisma.brand.update({
      where: { id: b.id },
      data: { productCount },
    });
  }
}
