import { products as staticProducts } from "@/data/products";
import type { Product } from "@/data/types";
import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "@/lib/catalog/map-product";
import { prisma } from "@/lib/prisma";

/**
 * Prefer relational `PortfolioBuildProduct` rows when present; otherwise resolve `productIds` tokens.
 */
export async function resolvePortfolioLinkedProducts(
  buildSlug: string,
  productIdsFallback: string[]
): Promise<Product[]> {
  try {
    const row = await prisma.portfolioBuild.findUnique({
      where: { slug: buildSlug },
      include: {
        linkedProducts: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { include: productWithVehicleCompatInclude },
          },
        },
      },
    });
    if (row?.linkedProducts.length) {
      return row.linkedProducts.map((l) => prismaProductToDTO(l.product));
    }
  } catch {
    /* DATABASE_URL missing / unreachable */
  }

  return resolvePortfolioProducts(productIdsFallback);
}

/**
 * Resolve tokens listed on `PortfolioBuild.productIds` to full `Product` rows.
 * Tokens match static `Product.id` and seeded `Product.legacyId` (not slugs in current seed).
 */
export async function resolvePortfolioProducts(
  productIds: string[]
): Promise<Product[]> {
  if (productIds.length === 0) return [];

  const tokens = Array.from(new Set(productIds));
  const hit = new Map<string, Product>();

  try {
    const rows = await prisma.product.findMany({
      where: {
        OR: [
          { legacyId: { in: tokens } },
          { id: { in: tokens } },
          { slug: { in: tokens } },
        ],
      },
      include: productWithVehicleCompatInclude,
    });
    for (const r of rows) {
      const dto = prismaProductToDTO(r);
      hit.set(r.id, dto);
      if (r.legacyId) hit.set(r.legacyId, dto);
      hit.set(r.slug, dto);
    }
  } catch {
    /* DATABASE_URL missing / unreachable */
  }

  const staticById = new Map(staticProducts.map((p) => [p.id, p]));
  const staticBySlug = new Map(staticProducts.map((p) => [p.slug, p]));

  function one(token: string): Product | undefined {
    return hit.get(token) ?? staticById.get(token) ?? staticBySlug.get(token);
  }

  const ordered: Product[] = [];
  const seenSlug = new Set<string>();
  for (const token of productIds) {
    const p = one(token);
    if (p && !seenSlug.has(p.slug)) {
      seenSlug.add(p.slug);
      ordered.push(p);
    }
  }
  return ordered;
}

/**
 * Normalize a slug, legacy id, or internal id to the catalog token used inside `Build.productIds`.
 */
export async function canonicalPortfolioProductToken(
  ref: string
): Promise<string | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  try {
    const row = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: trimmed },
          { legacyId: trimmed },
          { id: trimmed },
        ],
      },
      select: { id: true, legacyId: true },
    });
    if (row) return row.legacyId ?? row.id;
  } catch {
    /* ignore */
  }

  const p = staticProducts.find(
    (x) => x.slug === trimmed || x.id === trimmed
  );
  return p?.id ?? null;
}
