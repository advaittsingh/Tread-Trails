import type { Car } from "@tread-trails/shared-types";

import {
  mapVehicleRowToCar,
  vehicleListSelect,
} from "../../lib/catalog/map-vehicle.js";
import { loadStaticCars } from "../../lib/static-data.js";
import { prisma } from "../../lib/prisma.js";

function staticToVehiclePayload(c: Car) {
  return { ...c };
}

export const vehiclesService = {
  async getBySlug(slug: string): Promise<Car | null> {
    const trimmed = slug.trim();
    if (!trimmed) return null;

    try {
      const v = await prisma.vehicle.findUnique({
        where: { slug: trimmed },
        select: vehicleListSelect,
      });
      if (v) return mapVehicleRowToCar(v);
    } catch {
      /* ignore */
    }

    const staticCars = await loadStaticCars();
    return staticCars.find((c) => c.slug === trimmed) ?? null;
  },

  async list(): Promise<Car[]> {
    try {
      const vehicles = await prisma.vehicle.findMany({
        select: vehicleListSelect,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
      if (vehicles.length > 0) {
        return vehicles.map(mapVehicleRowToCar);
      }
    } catch {
      /* ignore */
    }

    const staticCars = await loadStaticCars();
    return staticCars.map(staticToVehiclePayload);
  },
};
