import { unstable_cache } from "next/cache";

import {
  cars as staticCars,
  getCarBySlug as getStaticCarBySlug,
} from "@/data/vehicle";
import type { Car } from "@/data/types";
import {
  buildVehicleWhere,
  listVehiclesFromDb,
  mapVehicleRowToCar,
} from "@/lib/catalog/vehicle-hierarchy";
import { sortCarsByCategory } from "@/lib/vehicle-categories";
import { listProductsForVehicleSlug } from "@/lib/server/product-catalog";
import { VEHICLE_CATALOG_TAG } from "@/lib/server/revalidate-vehicle-catalog";
import { prisma } from "@/lib/prisma";

const cachedListVehicles = unstable_cache(
  async () => listVehiclesFromDb(),
  ["vehicle-catalog-list"],
  { tags: [VEHICLE_CATALOG_TAG], revalidate: 120 }
);

/** Vehicles from DB when seeded; static catalog only when DB is empty/unreachable. */
export async function listVehicles(): Promise<Car[]> {
  try {
    const rows = await cachedListVehicles();
    if (rows.length > 0) return sortCarsByCategory(rows);
  } catch {
    /* DATABASE_URL missing / unreachable */
  }
  return sortCarsByCategory(staticCars);
}

/** Single vehicle from DB when present; otherwise static catalog. */
export async function getVehicleBySlug(slug: string): Promise<Car | null> {
  try {
    const v = await prisma.vehicle.findUnique({
      where: { slug },
      select: {
        id: true,
        legacyId: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        heroImage: true,
        thumbnail: true,
        category: true,
        engineSummary: true,
        modelYearsLabel: true,
        trimSummary: true,
        generationKey: true,
        model: {
          select: {
            slug: true,
            name: true,
            make: { select: { slug: true, name: true } },
          },
        },
      },
    });
    if (v) return mapVehicleRowToCar(v);
  } catch {
    /* ignore */
  }
  return getStaticCarBySlug(slug) ?? null;
}

export { listProductsForVehicleSlug };

/** Vehicle slugs for static generation (DB preferred). */
export async function listVehicleSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.vehicle.findMany({
      select: { slug: true },
      orderBy: { slug: "asc" },
    });
    if (rows.length > 0) return rows.map((r) => r.slug);
  } catch {
    /* ignore */
  }
  return staticCars.map((c) => c.slug);
}

export async function searchVehicles(filters: {
  search?: string;
  category?: string;
  makeId?: string;
  modelId?: string;
}): Promise<Car[]> {
  try {
    const rows = await prisma.vehicle.findMany({
      where: buildVehicleWhere(filters),
      select: {
        id: true,
        legacyId: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        heroImage: true,
        thumbnail: true,
        category: true,
        engineSummary: true,
        modelYearsLabel: true,
        trimSummary: true,
        generationKey: true,
        model: {
          select: {
            slug: true,
            name: true,
            make: { select: { slug: true, name: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    if (rows.length > 0) return sortCarsByCategory(rows.map(mapVehicleRowToCar));
  } catch {
    /* ignore */
  }
  let list = staticCars;
  if (filters.category) {
    list = list.filter((c) => c.category === filters.category);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q)
    );
  }
  return sortCarsByCategory(list);
}
