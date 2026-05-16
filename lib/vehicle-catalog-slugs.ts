import { cars } from "@/data/cars";

export { isKnownVehicleCatalogSlug } from "@/hooks/use-vehicle-catalog";

/** Static slug list (dev fallback when API not loaded). */
export function staticVehicleCatalogSlugs(): string[] {
  return cars.map((c) => c.slug);
}
