import type { Vehicle } from "@prisma/client";

import type { Car } from "@/data/types";
import { mapVehicleRowToCar } from "@/lib/catalog/vehicle-hierarchy";

/** Map a Prisma vehicle row without relations (admin list legacy). */
export function prismaVehicleToCar(v: Vehicle): Car {
  return mapVehicleRowToCar(v);
}
