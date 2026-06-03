import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiFetchJson, buildApiPath } from "@/api/client";

export function useAdminQuery<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  const fullPath = buildApiPath(path, params);
  return useQuery({
    queryKey: ["admin", fullPath],
    queryFn: async () => apiFetchJson<T>(fullPath),
    staleTime: 30_000,
    ...options,
  });
}

export function useAdminMutation<TBody = unknown, TResult = unknown>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST"
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body?: TBody) =>
      apiFetchJson<TResult>(path, {
        method,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
