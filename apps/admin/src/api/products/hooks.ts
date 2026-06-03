import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminQuery } from "@/api/admin";
import { apiFetch, apiFetchJson, buildApiPath } from "@/api/client";
import {
  mockProductBundle,
  mockProductsList,
  mockProductsSummary,
} from "./mock";
import type {
  ProductDetailBundle,
  ProductsFilterParams,
  ProductsListResponse,
  ProductsSummary,
} from "./types";

const useMock =
  import.meta.env.VITE_PRODUCTS_MOCK === "true" ||
  import.meta.env.VITE_PRODUCTS_MOCK === "1";

export function useProductsSummary() {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "products", "summary", "mock"],
      queryFn: async () => mockProductsSummary,
    });
  }
  return useAdminQuery<ProductsSummary>("/api/admin/products/summary");
}

export function useProductsList(params: ProductsFilterParams) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 25,
    search: params.search,
    sku: params.sku,
    brand: params.brand,
    category: params.category,
    vehicle: params.vehicle,
    stockStatus:
      params.stockStatus && params.stockStatus !== "all"
        ? params.stockStatus
        : undefined,
    publicationStatus:
      params.publicationStatus && params.publicationStatus !== "all"
        ? params.publicationStatus
        : undefined,
  };

  if (useMock) {
    return useQuery({
      queryKey: ["admin", "products", "list", "mock", JSON.stringify(params)],
      queryFn: async () => mockProductsList,
    });
  }

  return useAdminQuery<ProductsListResponse>(
    "/api/admin/products",
    queryParams,
    { staleTime: 15_000 }
  );
}

export function useProductBundle(productId: string | null) {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "products", "bundle", "mock", productId],
      queryFn: async () => mockProductBundle,
      enabled: Boolean(productId),
    });
  }

  return useAdminQuery<ProductDetailBundle>(
    `/api/admin/products/${productId ?? ""}/bundle`,
    undefined,
    { enabled: Boolean(productId) }
  );
}

export function useBulkUpdateProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      ids: string[];
      brand?: string;
      category?: string;
      price?: number | null;
      priceDelta?: number;
      stockDelta?: number;
      vehicleSlugs?: string[];
    }) =>
      apiFetchJson("/api/admin/products/bulk", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchJson("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function usePatchProduct(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchJson(`/api/admin/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export async function downloadProductsExport(params: ProductsFilterParams) {
  const path = buildApiPath("/api/admin/products/export", {
    search: params.search,
    sku: params.sku,
    brand: params.brand,
    category: params.category,
    vehicle: params.vehicle,
    stockStatus:
      params.stockStatus !== "all" ? params.stockStatus : undefined,
    publicationStatus:
      params.publicationStatus !== "all"
        ? params.publicationStatus
        : undefined,
  });
  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tread-trails-products-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
