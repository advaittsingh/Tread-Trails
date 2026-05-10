import {
  cars as staticCars,
  getCarBySlug as getStaticCarBySlug,
  getProductsForVehicle as getStaticProductsForVehicle,
} from "@/data/vehicle";
import type { Car, Product } from "@/data/types";
import { prisma } from "@/lib/prisma";

import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "@/lib/catalog/map-product";

function prismaVehicleToCar(v: {
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
}): Car {
  return {
    id: v.legacyId ?? v.slug,
    slug: v.slug,
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    heroImage: v.heroImage,
    thumbnail: v.thumbnail,
    category: v.category,
    engineSummary: v.engineSummary,
    modelYearsLabel: v.modelYearsLabel,
    trimSummary: v.trimSummary,
  };
}

/** Vehicles from Neon when seeded; otherwise static `data/cars`. */
export async function listVehicles(): Promise<Car[]> {
  try {
    const rows = await prisma.vehicle.findMany({ orderBy: { name: "asc" } });
    if (rows.length > 0) return rows.map(prismaVehicleToCar);
  } catch {
    /* DATABASE_URL missing / unreachable */
  }
  return staticCars;
}

/** Single vehicle from Neon when present; otherwise static catalog. */
export async function getVehicleBySlug(slug: string): Promise<Car | null> {
  try {
    const v = await prisma.vehicle.findUnique({ where: { slug } });
    if (v) return prismaVehicleToCar(v);
  } catch {
    /* ignore */
  }
  return getStaticCarBySlug(slug) ?? null;
}

/** Compatible products from Neon when DB returns rows; otherwise explicit static edges → products. */
export async function listProductsForVehicleSlug(slug: string): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: {
        vehicleCompatibilities: {
          some: { vehicle: { slug } },
        },
      },
      include: productWithVehicleCompatInclude,
      orderBy: { name: "asc" },
    });
    if (rows.length > 0) return rows.map(prismaProductToDTO);
  } catch {
    /* ignore */
  }
  return getStaticProductsForVehicle(slug);
}

/** Vehicle slugs for static generation (DB preferred). */
export async function listVehicleSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.vehicle.findMany({ select: { slug: true } });
    if (rows.length > 0) return rows.map((r) => r.slug);
  } catch {
    /* ignore */
  }
  return staticCars.map((c) => c.slug);
}
