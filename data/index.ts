import { productSlugsShareVehiclePlatform } from "@/lib/compatibility/product-vehicle-map";

import {
  ADVVEN_PARTNER_BRANDS,
  productBelongsToPartnerSlug,
} from "./advven-brands";
import {
  builds,
  getBuildBySlug,
  getBuildsForVehicle,
} from "./build";
import { products } from "./products";
import type { Build, Car, Product } from "./types";
import { cars, getCarBySlug, getProductsForVehicle } from "./vehicle";

export type { Build, Car, Product } from "./types";
export { builds, cars, products };

export {
  getBuildBySlug,
  getBuildsForVehicle,
  getCarBySlug,
  getProductsForVehicle,
};

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export type BrandEntry = {
  name: string;
  slug: string;
  productCount: number;
  tagline?: string;
  logoSrc?: string;
};

/**
 * Hub brands only — same six partners as https://www.advven.com/brands.
 * On the server, prefer `listBrandEntries()` from `@/lib/server/brand-catalog` (Neon + fallback).
 */
export function getBrandEntries(): BrandEntry[] {
  return ADVVEN_PARTNER_BRANDS.map((b) => ({
    name: b.name,
    slug: b.slug,
    productCount: products.filter((p) =>
      productBelongsToPartnerSlug(p, b.slug)
    ).length,
    tagline: b.tagline,
    logoSrc: b.logoSrc,
  }));
}

export function getBrandEntryBySlug(slug: string): BrandEntry | undefined {
  return getBrandEntries().find((b) => b.slug === slug);
}

/** Resolve products for an Advven partner brand slug only. */
export function getProductsForBrandSlug(slug: string): Product[] {
  const partner = ADVVEN_PARTNER_BRANDS.find((b) => b.slug === slug);
  if (!partner) return [];
  return products.filter((p) => productBelongsToPartnerSlug(p, slug));
}

export function getProductsByIds(ids: string[]): Product[] {
  const map = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Product[];
}

export const productBrands = Array.from(
  new Set(products.map((p) => p.brand))
).sort();

export const productCategories = Array.from(
  new Set(products.map((p) => p.category))
).sort();

export function getRelatedProducts(slug: string, limit = 4) {
  const p = getProductBySlug(slug);
  if (!p) return [];
  return products
    .filter(
      (x) =>
        x.slug !== slug &&
        (x.category === p.category || x.brand === p.brand)
    )
    .slice(0, limit);
}

export function getBundleSuggestion(slug: string, limit = 2) {
  const p = getProductBySlug(slug);
  if (!p) return [];
  return products
    .filter(
      (x) =>
        x.slug !== slug && productSlugsShareVehiclePlatform(x.slug, p.slug)
    )
    .slice(0, limit);
}
