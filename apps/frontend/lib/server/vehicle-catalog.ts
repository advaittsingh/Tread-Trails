import { unstable_cache } from "next/cache";

import {
  cars as staticCars,
  getCarBySlug as getStaticCarBySlug,
} from "@/data/vehicle";
import type { Car } from "@/data/types";
import {
  buildStaticVehicleHierarchy,
  filterExplorerTree,
  getVehicleHierarchyTree,
  listUnassignedVehicles,
  type VehicleHierarchyNode,
} from "@/lib/catalog/vehicle-hierarchy";
import {
  isExplorerMakeExcluded,
  isExplorerVehicleExcluded,
} from "@/lib/vehicle-explorer";
import { sortCarsByCategory } from "@/lib/vehicle-categories";
import { listProductsForVehicleSlug } from "@/lib/server/product-catalog";
import { VEHICLE_CATALOG_TAG } from "@/lib/server/revalidate-vehicle-catalog";
import { apiFetchJson } from "@/services/api/server";

const cachedListVehicles = unstable_cache(
  async () => listVehiclesFromBackend(),
  ["vehicle-catalog-list"],
  { tags: [VEHICLE_CATALOG_TAG], revalidate: 120 }
);

function filterPublicVehicles(list: Car[]): Car[] {
  return sortCarsByCategory(list.filter((c) => !isExplorerVehicleExcluded(c)));
}

async function listVehiclesFromBackend(): Promise<Car[]> {
  const data = await apiFetchJson<{ vehicles?: Car[] }>("/api/vehicles", {
    revalidate: 120,
    tags: [VEHICLE_CATALOG_TAG],
  });
  return (data.vehicles ?? []).filter(Boolean);
}

/** Vehicles from DB when seeded; static catalog only when DB is empty/unreachable. */
export async function listVehicles(): Promise<Car[]> {
  try {
    const vehicles = await cachedListVehicles();
    if (vehicles.length > 0) return filterPublicVehicles(vehicles);
  } catch {
    /* DATABASE_URL missing / unreachable */
  }
  return filterPublicVehicles(staticCars);
}

/** Single vehicle from DB when present; otherwise static catalog. */
export async function getVehicleBySlug(slug: string): Promise<Car | null> {
  const trimmed = slug.trim();
  if (trimmed) {
    try {
      const data = await apiFetchJson<{ vehicle?: Car }>(
        `/api/vehicles?slug=${encodeURIComponent(trimmed)}`,
        { revalidate: 120, tags: [VEHICLE_CATALOG_TAG] }
      );
      if (data.vehicle) return data.vehicle;
    } catch {
      /* ignore */
    }
  }
  return getStaticCarBySlug(slug) ?? null;
}

export { listProductsForVehicleSlug };

const cachedExplorerTree = unstable_cache(
  async () => loadVehicleExplorerTree(),
  ["vehicle-explorer-tree"],
  { tags: [VEHICLE_CATALOG_TAG], revalidate: 120 }
);

async function loadVehicleExplorerTree(): Promise<VehicleHierarchyNode[]> {
  try {
    const [tree, unassigned] = await Promise.all([
      getVehicleHierarchyTree(),
      listUnassignedVehicles(),
    ]);

    const hasLinked = tree.some((mk) =>
      mk.models.some((m) => m.vehicles.length > 0)
    );

    if (hasLinked) {
      const pruned = filterExplorerTree(tree);

      const loose = unassigned.filter(
        (v) => !v.makeSlug || !isExplorerMakeExcluded(v.makeSlug)
      );
      if (loose.length > 0) {
        pruned.push({
          make: { id: "other", slug: "other", name: "Other platforms" },
          models: [
            {
              model: { id: "other-misc", slug: "misc", name: "Unassigned" },
              vehicles: loose,
            },
          ],
        });
      }

      return pruned;
    }
  } catch {
    /* DATABASE_URL missing / unreachable */
  }

  return filterExplorerTree(buildStaticVehicleHierarchy(staticCars));
}

/** Brand → model line → variant tree for `/vehicles` explorer. */
export async function getVehicleExplorerTree(): Promise<VehicleHierarchyNode[]> {
  return cachedExplorerTree();
}

/** Vehicle slugs for static generation (DB preferred). */
export async function listVehicleSlugs(): Promise<string[]> {
  try {
    const vehicles = await listVehiclesFromBackend();
    if (vehicles.length > 0) return vehicles.map((v) => v.slug);
  } catch {}
  return staticCars.map((c) => c.slug);
}

export async function searchVehicles(filters: {
  search?: string;
  category?: string;
  makeId?: string;
  modelId?: string;
}): Promise<Car[]> {
  // Phase 5: vehicle search is served from backend APIs; fallback to static list.
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
