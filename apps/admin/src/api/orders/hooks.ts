import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminQuery } from "@/api/admin";
import { apiFetch, apiFetchJson, buildApiPath } from "@/api/client";
import {
  mockOrderDetail,
  mockOrdersList,
  mockOrdersSummary,
} from "./mock";
import type {
  OrderDetailResponse,
  OrdersFilterParams,
  OrdersListResponse,
  OrdersSummary,
} from "./types";

const useMock =
  import.meta.env.VITE_ORDERS_MOCK === "true" ||
  import.meta.env.VITE_ORDERS_MOCK === "1";

function filtersKey(params: OrdersFilterParams) {
  return JSON.stringify(params);
}

export function useOrdersSummary() {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "orders", "summary", "mock"],
      queryFn: async () => mockOrdersSummary,
      staleTime: 30_000,
    });
  }
  return useAdminQuery<OrdersSummary>("/api/admin/orders/summary");
}

export function useOrdersList(params: OrdersFilterParams) {
  const queryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 25,
    search: params.search,
    customerName: params.customerName,
    status: params.status && params.status !== "all" ? params.status : undefined,
    payment: params.payment && params.payment !== "all" ? params.payment : undefined,
    paymentStatus:
      params.paymentStatus && params.paymentStatus !== "all"
        ? params.paymentStatus
        : undefined,
    phone: params.phone,
    vehicle: params.vehicle,
    brand: params.brand,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  if (useMock) {
    return useQuery({
      queryKey: ["admin", "orders", "list", "mock", filtersKey(params)],
      queryFn: async () => mockOrdersList,
      staleTime: 15_000,
    });
  }

  return useAdminQuery<OrdersListResponse>(
    "/api/admin/orders",
    queryParams,
    { staleTime: 15_000 }
  );
}

export function useOrderDetail(orderId: string | null) {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "orders", "detail", "mock", orderId],
      queryFn: async () => mockOrderDetail,
      enabled: Boolean(orderId),
    });
  }

  return useAdminQuery<OrderDetailResponse>(
    `/api/admin/orders/${orderId ?? ""}`,
    undefined,
    { enabled: Boolean(orderId), staleTime: 10_000 }
  );
}

export function useBulkUpdateOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      ids: string[];
      status: string;
      shippingCarrier?: string;
    }) =>
      apiFetchJson<{ updated: string[]; count: number }>("/api/admin/orders/bulk", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export async function downloadOrdersExport(params: OrdersFilterParams) {
  const path = buildApiPath("/api/admin/orders/export", {
    search: params.search,
    customerName: params.customerName,
    status: params.status !== "all" ? params.status : undefined,
    payment: params.payment !== "all" ? params.payment : undefined,
    paymentStatus:
      params.paymentStatus !== "all" ? params.paymentStatus : undefined,
    phone: params.phone,
    vehicle: params.vehicle,
    brand: params.brand,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tread-trails-orders-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
