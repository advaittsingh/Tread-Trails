import { revalidateTag } from "next/cache";

export const VEHICLE_CATALOG_TAG = "vehicle-catalog";

export function revalidateVehicleCatalog() {
  revalidateTag(VEHICLE_CATALOG_TAG);
}
