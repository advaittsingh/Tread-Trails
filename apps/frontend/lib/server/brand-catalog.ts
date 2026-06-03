import { ADVVEN_PARTNER_BRANDS, productBelongsToPartnerSlug } from "@/data/advven-brands";
import type { BrandEntry } from "@/data/index";
import { listProducts } from "@/lib/server/product-catalog";
import { apiFetchJson } from "@/services/api/server";

async function staticBrandEntries(): Promise<BrandEntry[]> {
  const catalog = await listProducts();
  return ADVVEN_PARTNER_BRANDS.map((b) => ({
    name: b.name,
    slug: b.slug,
    productCount: catalog.filter((p) =>
      productBelongsToPartnerSlug(p, b.slug)
    ).length,
    tagline: b.tagline,
    logoSrc: b.logoSrc,
  }));
}

/** Partner brands from Neon when seeded; otherwise static Advven lineup + counts. */
export async function listBrandEntries(): Promise<BrandEntry[]> {
  try {
    const data = await apiFetchJson<{ brands?: BrandEntry[] }>("/api/brands", {
      revalidate: 300,
      tags: ["brands", "product-catalog"],
    });
    const list = data.brands ?? [];
    if (list.length > 0) return list;
  } catch {}
  return staticBrandEntries();
}

export async function getBrandBySlug(slug: string): Promise<BrandEntry | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  try {
    const data = await apiFetchJson<BrandEntry>(
      `/api/brands?slug=${encodeURIComponent(trimmed)}`,
      { revalidate: 300, tags: ["brands", "product-catalog"] }
    );
    if (data?.slug) return data;
  } catch {}
  const entries = await staticBrandEntries();
  return entries.find((b) => b.slug === slug) ?? null;
}

export async function listBrandSlugs(): Promise<string[]> {
  try {
    const entries = await listBrandEntries();
    if (entries.length > 0) return entries.map((b) => b.slug);
  } catch {}
  return ADVVEN_PARTNER_BRANDS.map((b) => b.slug);
}

/** Recompute `productCount` from DB rows using the same partner-slug rules as the static catalog. */
export async function recountBrandProductCountsFromDb(): Promise<void> {
  // Storefront no longer writes to DB in Phase 5. This is a backend/admin concern now.
  return;
}
