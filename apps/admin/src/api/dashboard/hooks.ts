import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { mockDashboardData } from "./mock";
import type { AdminDashboardData } from "./types";

const DASHBOARD_PATH = "/api/admin/dashboard";

const useMock =
  import.meta.env.VITE_DASHBOARD_MOCK === "true" ||
  import.meta.env.VITE_DASHBOARD_MOCK === "1";

export async function fetchDashboard(): Promise<AdminDashboardData> {
  if (useMock) return mockDashboardData;
  return apiFetchJson<AdminDashboardData>(DASHBOARD_PATH);
}

export function useDashboard(
  options?: Omit<
    UseQueryOptions<AdminDashboardData, Error>,
    "queryKey" | "queryFn"
  >
) {
  if (useMock) {
    return useQuery({
      queryKey: ["admin", "dashboard", "mock"],
      queryFn: async () => mockDashboardData,
      staleTime: 60_000,
      ...options,
    });
  }

  return useAdminQuery<AdminDashboardData>(DASHBOARD_PATH, undefined, {
    staleTime: 20_000,
    refetchInterval: 60_000,
    ...options,
  });
}

/** Granular hooks for widgets that may fetch independently later. */
export function useDashboardKpis() {
  const q = useDashboard();
  return { ...q, data: q.data?.kpis };
}

export function useDashboardAnalytics() {
  const q = useDashboard();
  return { ...q, data: q.data?.analytics };
}

export function useDashboardOperational() {
  const q = useDashboard();
  return { ...q, data: q.data?.operational };
}

export function useDashboardRecentOrders() {
  const q = useDashboard();
  return { ...q, data: q.data?.recentOrders ?? [] };
}

export function useDashboardLeads() {
  const q = useDashboard();
  return { ...q, data: q.data?.leads ?? [] };
}

export function useDashboardCompatibility() {
  const q = useDashboard();
  return { ...q, data: q.data?.compatibility };
}

export function useDashboardActivity() {
  const q = useDashboard();
  return { ...q, data: q.data?.activity ?? [] };
}
