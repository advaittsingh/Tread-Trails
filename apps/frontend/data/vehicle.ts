import { getProductSlugsForVehicleSlug } from "@/lib/compatibility/product-vehicle-map";

import { cars } from "./cars";
import { products } from "./products";
import type { Car, Product } from "./types";

export { cars };

export function getCarBySlug(slug: string): Car | undefined {
  return cars.find((c) => c.slug === slug);
}

/** Uses explicit `PRODUCT_VEHICLE_COMPATIBILITY_EDGES` (+ derived `compatibleCars` on products). */
export function getProductsForVehicle(slug: string): Product[] {
  const allowed = new Set(getProductSlugsForVehicleSlug(slug));
  return products.filter((p) => allowed.has(p.slug));
}
