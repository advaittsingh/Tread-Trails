// @ts-nocheck — runtime-only monolith static catalog (tsx resolves @/ in data/*).
import type { Build, Car, Product } from "@tread-trails/shared-types";

import type { BrandEntry } from "./catalog/map-brand.js";

const data = ["..", "..", "..", "..", "data"].join("/");

export async function loadStaticProductsRuntime(): Promise<Product[]> {
  const mod = await import(`${data}/products.js`);
  return [...mod.products].sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadStaticCarsRuntime(): Promise<Car[]> {
  const mod = await import(`${data}/cars.js`);
  return mod.cars;
}

export async function loadStaticBuildsRuntime(): Promise<Build[]> {
  const mod = await import(`${data}/build.js`);
  return mod.builds;
}

export async function loadStaticBrandEntriesRuntime(): Promise<BrandEntry[]> {
  const { ADVVEN_PARTNER_BRANDS, productBelongsToPartnerSlug } = await import(
    `${data}/advven-brands.js`
  );
  const products = await loadStaticProductsRuntime();
  return ADVVEN_PARTNER_BRANDS.map((b) => ({
    name: b.name,
    slug: b.slug,
    productCount: products.filter((p) => productBelongsToPartnerSlug(p, b.slug))
      .length,
    tagline: b.tagline,
    logoSrc: b.logoSrc,
  }));
}
