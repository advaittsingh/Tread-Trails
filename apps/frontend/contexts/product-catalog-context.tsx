"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { Product } from "@/data/types";
import { searchProductsInCatalog } from "@/lib/catalog/search-products";

type ProductCatalogContextValue = {
  products: Product[];
  getProductBySlug: (slug: string) => Product | undefined;
  searchProducts: (query: string, limit?: number) => Product[];
};

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(
  null
);

export function ProductCatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  const bySlug = useMemo(
    () => new Map(products.map((p) => [p.slug, p])),
    [products]
  );

  const getProductBySlug = useCallback(
    (slug: string) => bySlug.get(slug.trim()),
    [bySlug]
  );

  const searchProducts = useCallback(
    (query: string, limit = 8) =>
      searchProductsInCatalog(products, query, limit),
    [products]
  );

  const value = useMemo(
    () => ({ products, getProductBySlug, searchProducts }),
    [products, getProductBySlug, searchProducts]
  );

  return (
    <ProductCatalogContext.Provider value={value}>
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog(): ProductCatalogContextValue {
  const ctx = useContext(ProductCatalogContext);
  if (!ctx) {
    throw new Error("useProductCatalog must be used within ProductCatalogProvider");
  }
  return ctx;
}
