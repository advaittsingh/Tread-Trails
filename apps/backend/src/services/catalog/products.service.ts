import type { Product } from "@tread-trails/shared-types";

import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "../../lib/catalog/map-product.js";
import { loadStaticProducts } from "../../lib/static-data.js";
import { prisma } from "../../lib/prisma.js";

async function loadProductsFromDb(): Promise<Product[] | null> {
  try {
    const rows = await prisma.product.findMany({
      include: productWithVehicleCompatInclude,
      orderBy: { name: "asc" },
    });
    if (rows.length === 0) return null;
    return rows.map(prismaProductToDTO);
  } catch {
    return null;
  }
}

export async function listProducts(): Promise<Product[]> {
  const fromDb = await loadProductsFromDb();
  if (fromDb) return fromDb;
  return loadStaticProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const catalog = await listProducts();
  return catalog.find((p) => p.slug === trimmed) ?? null;
}

export async function listProductsForVehicleSlug(
  vehicleSlug: string
): Promise<Product[]> {
  const slug = vehicleSlug.trim();
  if (!slug) return [];
  const catalog = await listProducts();
  return catalog.filter((p) => p.compatibleCars.includes(slug));
}

export async function getProductsByTokens(tokens: string[]): Promise<Product[]> {
  if (tokens.length === 0) return [];

  const catalog = await listProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));

  try {
    const unique = Array.from(new Set(tokens.map((t) => t.trim()).filter(Boolean)));
    const rows = await prisma.product.findMany({
      where: {
        OR: [
          { legacyId: { in: unique } },
          { id: { in: unique } },
          { slug: { in: unique } },
        ],
      },
      include: productWithVehicleCompatInclude,
    });
    for (const row of rows) {
      const dto = prismaProductToDTO(row);
      byId.set(row.id, dto);
      if (row.legacyId) byId.set(row.legacyId, dto);
      bySlug.set(row.slug, dto);
    }
  } catch {
    /* DB unreachable */
  }

  function one(token: string): Product | undefined {
    return byId.get(token) ?? bySlug.get(token);
  }

  const ordered: Product[] = [];
  const seenSlug = new Set<string>();
  for (const token of tokens) {
    const p = one(token);
    if (p && !seenSlug.has(p.slug)) {
      seenSlug.add(p.slug);
      ordered.push(p);
    }
  }
  return ordered;
}
