import { products as staticProducts } from "@/data/products";
import type { Product } from "@/data/types";
import { getProductsByTokens } from "@/lib/server/product-catalog";
import { apiFetchJson } from "@/services/api/server";

/**
 * Prefer relational `PortfolioBuildProduct` rows when present; otherwise resolve `productIds` tokens.
 */
export async function resolvePortfolioLinkedProducts(
  buildSlug: string,
  productIdsFallback: string[]
): Promise<Product[]> {
  const trimmed = buildSlug.trim();
  if (trimmed) {
    try {
      const data = await apiFetchJson<{ products?: Product[] }>(
        `/api/portfolio/builds/${encodeURIComponent(trimmed)}?expand=products`,
        { revalidate: 60, tags: ["builds", "product-catalog"] }
      );
      const list = data.products ?? [];
      if (list.length > 0) return list;
    } catch {}
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

  const p = staticProducts.find(
    (x) => x.slug === trimmed || x.id === trimmed
  );
  return p?.id ?? null;
}
