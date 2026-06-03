import type { Car } from "@/data/types";
import {
  parseVehicleSlug,
  vehicleMakeDisplayName,
  vehicleModelDisplayName,
} from "@/lib/server/backfill-vehicle-hierarchy";
import { isExplorerMakeExcluded } from "@/lib/vehicle-explorer";

function titleCase(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export type VehicleHierarchyNode = {
  make: { id: string; slug: string; name: string };
  models: Array<{
    model: { id: string; slug: string; name: string };
    vehicles: Car[];
  }>;
};

export type VehicleListFilters = {
  search?: string;
  category?: string;
  makeId?: string;
  modelId?: string;
};

export function mapVehicleRowToCar(
  row: {
    id: string;
    legacyId: string | null;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    heroImage: string;
    thumbnail: string;
    category: string;
    engineSummary: string;
    modelYearsLabel: string;
    trimSummary: string;
    generationKey?: string | null;
    model?: {
      slug: string;
      name: string;
      make: { slug: string; name: string };
    } | null;
  }
): Car {
  return {
    id: row.legacyId ?? row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    heroImage: row.heroImage,
    thumbnail: row.thumbnail,
    category: row.category,
    engineSummary: row.engineSummary,
    modelYearsLabel: row.modelYearsLabel,
    trimSummary: row.trimSummary,
    makeSlug: row.model?.make.slug,
    makeName: row.model?.make.name,
    modelSlug: row.model?.slug,
    modelName: row.model?.name,
    generationKey: row.generationKey ?? undefined,
  };
}

// NOTE: In Phase 5, storefront no longer queries Prisma directly, so we keep
// mapping/helpers but remove DB query selectors.

export function buildVehicleWhere(filters: VehicleListFilters) {
  const where: {
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      slug?: { contains: string; mode: "insensitive" };
      tagline?: { contains: string; mode: "insensitive" };
    }>;
    category?: string;
    modelId?: string;
    model?: { makeId?: string };
  } = {};

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.category?.trim()) where.category = filters.category.trim();
  if (filters.modelId) where.modelId = filters.modelId;
  if (filters.makeId) where.model = { makeId: filters.makeId };
  return where;
}

export async function listVehiclesFromDb(filters: VehicleListFilters = {}) {
  // Phase 5: storefront no longer queries DB directly.
  void filters;
  return [];
}

export async function getVehicleHierarchyTree(): Promise<VehicleHierarchyNode[]> {
  // Phase 5: vehicle hierarchy is provided by backend; this is only used as a fallback.
  return [];
}

export async function listUnassignedVehicles(): Promise<Car[]> {
  // Phase 5: storefront no longer queries DB directly.
  return [];
}

/** Group fitment platforms under a model line by generation / year span. */
export type VehicleGenerationGroup = {
  id: string;
  title: string;
  subtitle?: string;
  vehicles: Car[];
};

export function groupVehiclesByGeneration(vehicles: Car[]): VehicleGenerationGroup[] {
  const groups = new Map<string, VehicleGenerationGroup>();

  for (const v of vehicles) {
    const id = v.generationKey ?? (v.modelYearsLabel || v.slug);
    const existing = groups.get(id);
    if (existing) {
      existing.vehicles.push(v);
      continue;
    }
    const title =
      v.modelYearsLabel.trim() ||
      (v.generationKey ? titleCase(v.generationKey.replace(/-/g, " ")) : v.name);
    groups.set(id, {
      id,
      title,
      subtitle: v.generationKey && v.modelYearsLabel ? v.name : undefined,
      vehicles: [v],
    });
  }

  return Array.from(groups.values()).sort((a, b) => a.title.localeCompare(b.title));
}

/** Build make → model → vehicle tree from flat catalog (static fallback). */
export function buildStaticVehicleHierarchy(cars: Car[]): VehicleHierarchyNode[] {
  type ModelAcc = {
    model: { id: string; slug: string; name: string };
    vehicles: Car[];
  };
  type MakeAcc = {
    make: { id: string; slug: string; name: string };
    models: Map<string, ModelAcc>;
  };

  const makes = new Map<string, MakeAcc>();

  for (const car of cars) {
    const parsed = parseVehicleSlug(car.slug);
    const makeSlug = car.makeSlug ?? parsed?.makeSlug;
    if (!makeSlug || isExplorerMakeExcluded(makeSlug)) continue;

    const modelSlug = car.modelSlug ?? parsed?.modelSlug ?? "platform";
    const makeName = car.makeName ?? vehicleMakeDisplayName(makeSlug);
    const modelName = car.modelName ?? vehicleModelDisplayName(modelSlug);

    let make = makes.get(makeSlug);
    if (!make) {
      make = {
        make: { id: makeSlug, slug: makeSlug, name: makeName },
        models: new Map(),
      };
      makes.set(makeSlug, make);
    }

    let model = make.models.get(modelSlug);
    if (!model) {
      model = {
        model: { id: `${makeSlug}-${modelSlug}`, slug: modelSlug, name: modelName },
        vehicles: [],
      };
      make.models.set(modelSlug, model);
    }
    model.vehicles.push(car);
  }

  const nodes: VehicleHierarchyNode[] = Array.from(makes.values())
    .sort((a, b) => a.make.name.localeCompare(b.make.name))
    .map((mk) => ({
      make: mk.make,
      models: Array.from(mk.models.values())
        .sort((a, b) => a.model.name.localeCompare(b.model.name))
        .map((m) => ({
          model: m.model,
          vehicles: m.vehicles.sort((a: Car, b: Car) => a.name.localeCompare(b.name)),
        })),
    }));

  return nodes.filter((n) => !isExplorerMakeExcluded(n.make.slug));
}

export function filterExplorerTree(
  tree: VehicleHierarchyNode[]
): VehicleHierarchyNode[] {
  return tree
    .filter((n) => !isExplorerMakeExcluded(n.make.slug))
    .map((mk) => ({
      ...mk,
      models: mk.models.filter((m) => m.vehicles.length > 0),
    }))
    .filter((mk) => mk.models.length > 0);
}

export function findMakeInTree(
  tree: VehicleHierarchyNode[],
  makeSlug: string
): VehicleHierarchyNode | undefined {
  return tree.find((n) => n.make.slug === makeSlug);
}

export function findModelInMake(
  node: VehicleHierarchyNode,
  modelSlug: string
): VehicleHierarchyNode["models"][number] | undefined {
  return node.models.find((m) => m.model.slug === modelSlug);
}
