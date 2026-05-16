import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

import { productBelongsToPartnerSlug } from "@/data/advven-brands";
import { products as staticProducts } from "@/data/products";
import type { Product } from "@/data/types";
import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "@/lib/catalog/map-product";
import { searchProductsInCatalog } from "@/lib/catalog/search-products";
import { productSlugsShareVehiclePlatform } from "@/lib/compatibility/product-vehicle-map";
import { prisma } from "@/lib/prisma";

export const PRODUCT_CATALOG_CACHE_TAG = "product-catalog";

/** Call after admin product CRUD so storefront cache reflects Neon. */
export function revalidateProductCatalog(): void {
  revalidateTag(PRODUCT_CATALOG_CACHE_TAG);
}

function staticCatalogSorted(): Product[] {
  return [...staticProducts].sort((a, b) => a.name.localeCompare(b.name));
}

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

const getCachedProductList = unstable_cache(
  async (): Promise<Product[]> => {
    const fromDb = await loadProductsFromDb();
    return fromDb ?? staticCatalogSorted();
  },
  ["product-catalog-list"],
  { revalidate: 60, tags: [PRODUCT_CATALOG_CACHE_TAG] }
);

/** Full catalog — Neon when seeded, otherwise static `data/products` (sorted by name). */
export async function listProducts(): Promise<Product[]> {
  return getCachedProductList();
}

/** Product slugs for static generation and sitemaps. */
export async function listProductSlugs(): Promise<string[]> {
  const catalog = await listProducts();
  return catalog.map((p) => p.slug);
}

/** Single product by slug — uses cached catalog to avoid duplicate round-trips. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const catalog = await listProducts();
  return catalog.find((p) => p.slug === trimmed) ?? null;
}

/** Resolve catalog tokens (`legacyId`, internal `id`, or slug) preserving order. */
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
    /* DATABASE_URL missing / unreachable */
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

/** Advven partner brand hub grid. */
export async function listProductsForBrandSlug(
  brandSlug: string
): Promise<Product[]> {
  const catalog = await listProducts();
  return catalog.filter((p) => productBelongsToPartnerSlug(p, brandSlug));
}

/** Vehicle hub compatible products (fitment from DB join or static edges on DTO). */
export async function listProductsForVehicleSlug(
  vehicleSlug: string
): Promise<Product[]> {
  const slug = vehicleSlug.trim();
  if (!slug) return [];
  const catalog = await listProducts();
  return catalog.filter((p) => p.compatibleCars.includes(slug));
}

/** Same-category or same-brand alternatives. */
export async function getRelatedProducts(
  slug: string,
  limit = 4
): Promise<Product[]> {
  const p = await getProductBySlug(slug);
  if (!p) return [];
  const catalog = await listProducts();
  return catalog
    .filter(
      (x) =>
        x.slug !== slug &&
        (x.category === p.category || x.brand === p.brand)
    )
    .slice(0, limit);
}

/** Products sharing a vehicle platform with the anchor SKU. */
export async function getBundleSuggestion(
  slug: string,
  limit = 2
): Promise<Product[]> {
  const p = await getProductBySlug(slug);
  if (!p) return [];
  const catalog = await listProducts();
  return catalog
    .filter(
      (x) =>
        x.slug !== slug && productSlugsShareVehiclePlatform(x.slug, p.slug)
    )
    .slice(0, limit);
}

export async function listProductBrands(): Promise<string[]> {
  const catalog = await listProducts();
  return Array.from(new Set(catalog.map((p) => p.brand))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function listProductCategories(): Promise<string[]> {
  const catalog = await listProducts();
  return Array.from(new Set(catalog.map((p) => p.category))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function listFeaturedProducts(limit = 4): Promise<Product[]> {
  const catalog = await listProducts();
  return catalog.slice(0, limit);
}

export async function searchProducts(
  query: string,
  limit = 8
): Promise<Product[]> {
  const catalog = await listProducts();
  return searchProductsInCatalog(catalog, query, limit);
}
