import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma.js";

export type VehicleHierarchyNode = {
  make: { id: string; slug: string; name: string };
  models: Array<{
    model: { id: string; slug: string; name: string };
    vehicles: Array<{ id: string; slug: string; name: string; category: string }>;
  }>;
};

export type VehicleListFilters = {
  search?: string;
  category?: string;
  makeId?: string;
  modelId?: string;
};

export function buildVehicleWhere(
  filters: VehicleListFilters
): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {};

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

export async function getVehicleHierarchyTree(): Promise<VehicleHierarchyNode[]> {
  const makes = await prisma.vehicleMake.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      models: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          vehicles: {
            select: { id: true, slug: true, name: true, category: true },
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
      vehicles: m.vehicles.map((v) => ({
        id: v.id,
        slug: v.slug,
        name: v.name,
        category: v.category,
      })),
    })),
  }));
}

export async function listUnassignedVehicles(): Promise<
  Array<{ id: string; slug: string; name: string; category: string }>
> {
  const rows = await prisma.vehicle.findMany({
    where: { modelId: null },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows;
}
