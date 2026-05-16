import { products as staticProducts } from "@/data/products";
import type { Product } from "@/data/types";
import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "@/lib/catalog/map-product";
import { getProductsByTokens } from "@/lib/server/product-catalog";
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

  return getProductsByTokens(productIdsFallback);
}

/** @deprecated Use `getProductsByTokens` from product-catalog. */
export async function resolvePortfolioProducts(
  productIds: string[]
): Promise<Product[]> {
  return getProductsByTokens(productIds);
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
