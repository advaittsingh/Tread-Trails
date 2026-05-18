import type { Car } from "@/data/types";

/** OEM makes hidden from the public `/vehicles` brand explorer. */
export const VEHICLE_EXPLORER_EXCLUDED_MAKE_SLUGS = new Set([
  "armoured",
  "restoration",
]);

const EXCLUDED_VEHICLE_SLUG_PREFIXES = ["restoration-"] as const;
const EXCLUDED_VEHICLE_SLUGS = new Set(["armoured-special-utility"]);

export function isExplorerMakeExcluded(makeSlug: string): boolean {
  return VEHICLE_EXPLORER_EXCLUDED_MAKE_SLUGS.has(makeSlug);
}

export function isExplorerVehicleExcluded(car: Pick<Car, "slug" | "makeSlug">): boolean {
  if (car.makeSlug && isExplorerMakeExcluded(car.makeSlug)) return true;
  if (EXCLUDED_VEHICLE_SLUGS.has(car.slug)) return true;
  return EXCLUDED_VEHICLE_SLUG_PREFIXES.some((p) => car.slug.startsWith(p));
}
