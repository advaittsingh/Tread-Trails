import type { Car } from "@/data/types";
import { prisma } from "@/lib/prisma";

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

const vehicleSelect = {
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
  sortOrder: true,
  modelId: true,
  model: {
    select: {
      id: true,
      slug: true,
      name: true,
      make: { select: { id: true, slug: true, name: true } },
    },
  },
} as const;

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
  const rows = await prisma.vehicle.findMany({
    where: buildVehicleWhere(filters),
    select: vehicleSelect,
    orderBy: [
      { sortOrder: "asc" },
      { model: { make: { sortOrder: "asc" } } },
      { model: { sortOrder: "asc" } },
      { name: "asc" },
    ],
  });
  return rows.map(mapVehicleRowToCar);
}

export async function getVehicleHierarchyTree(): Promise<VehicleHierarchyNode[]> {
  const makes = await prisma.vehicleMake.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      models: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          vehicles: {
            select: vehicleSelect,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });

  return makes.map((mk) => ({
    make: { id: mk.id, slug: mk.slug, name: mk.name },
    models: mk.models.map((m) => ({
      model: { id: m.id, slug: m.slug, name: m.name },
      vehicles: m.vehicles.map(mapVehicleRowToCar),
    })),
  }));
}

export async function listUnassignedVehicles(): Promise<Car[]> {
  const rows = await prisma.vehicle.findMany({
    where: { modelId: null },
    select: vehicleSelect,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapVehicleRowToCar);
}
