import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminQuery } from "@/api/admin";
import { apiFetch, apiFetchJson, buildApiPath } from "@/api/client";
import {
  mockInventoryBundle,
  mockInventoryInsights,
  mockInventoryList,
  mockInventorySummary,
  mockMovements,
  mockPurchaseOrders,
  mockReorderSuggestions,
} from "./mock";
import type {
  InventoryFilterParams,
  InventoryInsights,
  InventoryListResponse,
  InventoryMovement,
  InventoryProductBundle,
  InventorySummary,
  PurchaseOrderRow,
  ReorderSuggestion,
  StockAdjustmentReason,
} from "./types";

const useMock =
  import.meta.env.VITE_INVENTORY_MOCK === "true" ||
  import.meta.env.VITE_INVENTORY_MOCK === "1";

export function useInventorySummary() {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "inventory", "summary", "mock"],
      queryFn: async () => mockInventorySummary,
    });
  }
  return useAdminQuery<InventorySummary>("/api/admin/inventory/summary");
}

export function useInventoryList(params: InventoryFilterParams) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 25,
    search: params.search,
    brand: params.brand,
    vehicle: params.vehicle,
    stockStatus:
      params.stockStatus && params.stockStatus !== "all"
        ? params.stockStatus
        : undefined,
  };

  if (useMock) {
    return useQuery({
      queryKey: ["admin", "inventory", "list", "mock", JSON.stringify(params)],
      queryFn: async () => mockInventoryList,
    });
  }

  return useAdminQuery<InventoryListResponse>(
    "/api/admin/inventory",
    queryParams,
    { staleTime: 15_000 }
  );
}

export function useInventoryBundle(productId: string | null) {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "inventory", "bundle", "mock", productId],
      queryFn: async () => mockInventoryBundle,
      enabled: Boolean(productId),
    });
  }

  return useAdminQuery<InventoryProductBundle>(
    `/api/admin/inventory/products/${productId ?? ""}/bundle`,
    undefined,
    { enabled: Boolean(productId) }
  );
}

export function useInventoryMovements(params: {
  page?: number;
  limit?: number;
  productId?: string;
  from?: string;
  to?: string;
}) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 25,
    productId: params.productId,
    from: params.from,
    to: params.to,
  };

  if (useMock) {
    return useQuery({
      queryKey: ["admin", "inventory", "movements", "mock", JSON.stringify(params)],
      queryFn: async () => ({
        movements: mockMovements,
        total: mockMovements.length,
        page: 1,
        totalPages: 1,
      }),
    });
  }

  return useAdminQuery<{
    movements: InventoryMovement[];
    total: number;
    page: number;
    totalPages: number;
  }>("/api/admin/inventory/movements", queryParams);
}

export function useReorderSuggestions() {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "inventory", "reorder", "mock"],
      queryFn: async () => ({ suggestions: mockReorderSuggestions }),
    });
  }
  return useAdminQuery<{ suggestions: ReorderSuggestion[] }>(
    "/api/admin/inventory/reorder-suggestions"
  );
}

export function usePurchaseOrders() {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "inventory", "purchase-orders", "mock"],
      queryFn: async () => ({ orders: mockPurchaseOrders }),
    });
  }
  return useAdminQuery<{ orders: PurchaseOrderRow[] }>(
    "/api/admin/inventory/purchase-orders"
  );
}

export function useInventoryInsights() {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "inventory", "insights", "mock"],
      queryFn: async () => mockInventoryInsights,
    });
  }
  return useAdminQuery<InventoryInsights>("/api/admin/inventory/insights");
}

export function useStockAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      productId: string;
      mode: "add" | "remove";
      quantity: number;
      reason: StockAdjustmentReason;
      note?: string;
    }) => {
      const endpoint =
        body.mode === "add"
          ? `/api/admin/inventory/${body.productId}/add`
          : `/api/admin/inventory/${body.productId}/remove`;
      const note = [body.reason, body.note].filter(Boolean).join(" — ");
      return apiFetchJson(endpoint, {
        method: "POST",
        body: JSON.stringify({ quantity: body.quantity, note }),
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useBulkInventoryUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      productIds: string[];
      stockDelta?: number;
      incomingDelta?: number;
    }) =>
      apiFetchJson("/api/admin/inventory/bulk-ids", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useImportInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (csv: string) =>
      apiFetchJson<{ updated: number; errors: string[] }>(
        "/api/admin/inventory/import",
        { method: "POST", body: JSON.stringify({ csv }) }
      ),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export async function downloadInventoryExport(params: InventoryFilterParams) {
  const path = buildApiPath("/api/admin/inventory/export-full", {
    search: params.search,
    brand: params.brand,
    vehicle: params.vehicle,
    stockStatus: params.stockStatus !== "all" ? params.stockStatus : undefined,
  });
  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tread-trails-inventory-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
