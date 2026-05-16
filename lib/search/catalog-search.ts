import type { Product } from "@/data/types";
import { searchProductsInCatalog } from "@/lib/catalog/search-products";

/** @deprecated Prefer `useProductCatalog().searchProducts` or `searchProducts` from product-catalog. */
export function searchCatalogProducts(
  catalog: Product[],
  query: string,
  limit = 8
): Product[] {
  return searchProductsInCatalog(catalog, query, limit);
}
