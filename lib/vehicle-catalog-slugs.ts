import { cars } from "@/data/cars";

/** Slug exists in static fleet catalog (`data/cars`). */
export function isKnownVehicleCatalogSlug(slug: string): boolean {
  return cars.some((c) => c.slug === slug);
}
