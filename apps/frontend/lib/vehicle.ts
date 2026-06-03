/**
 * Vehicle domain (static fallback): fleet in `data/cars` plus helpers for
 * compatible products. Neon-backed listings use
 * `/api/vehicles`, `/api/products?vehicleSlug=…`, `/api/compatibility?vehicleSlug=…`,
 * `/api/builds`, `/api/brands`,
 * `@/lib/server/vehicle-catalog`, `@/lib/server/build-catalog`, and `@/lib/server/brand-catalog`.
 * Sync build helpers stay on `@/lib/build`.
 */
export { cars, getCarBySlug, getProductsForVehicle } from "@/data/vehicle";

export type { Car } from "@/data/types";
