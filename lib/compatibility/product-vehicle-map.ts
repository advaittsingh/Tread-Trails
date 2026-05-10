import { PRODUCT_VEHICLE_COMPATIBILITY_EDGES } from "@/data/product-vehicle-compatibility-edges";

function uniqSorted(slugs: string[]): string[] {
  return Array.from(new Set(slugs)).sort((a, b) => a.localeCompare(b));
}

/** Vehicle platform slugs explicitly mapped to a product (static edges + same semantics as DB join). */
export function getVehicleSlugsForProductSlug(productSlug: string): string[] {
  const slugs = PRODUCT_VEHICLE_COMPATIBILITY_EDGES.filter(
    (e) => e.productSlug === productSlug
  ).map((e) => e.vehicleSlug);
  return uniqSorted(slugs);
}

/** Product slugs explicitly mapped to a vehicle platform. */
export function getProductSlugsForVehicleSlug(vehicleSlug: string): string[] {
  const slugs = PRODUCT_VEHICLE_COMPATIBILITY_EDGES.filter(
    (e) => e.vehicleSlug === vehicleSlug
  ).map((e) => e.productSlug);
  return uniqSorted(slugs);
}

/** True if two products share at least one mapped vehicle platform. */
export function productSlugsShareVehiclePlatform(
  productSlugA: string,
  productSlugB: string
): boolean {
  const a = new Set(getVehicleSlugsForProductSlug(productSlugA));
  return getVehicleSlugsForProductSlug(productSlugB).some((v) => a.has(v));
}
