"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

import { formatInr } from "@/lib/format";
import { toastError } from "@/lib/toast";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Row = {
  sessionId: string;
  itemCount: number;
  subtotalHint: number;
  userEmail: string | null;
  lastPath: string;
  updatedAt: string;
  lines: unknown;
};

export function AdminCartsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/admin/carts?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRows(data.carts as Row[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      toastError("Could not load carts", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchDraft);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          Abandoned carts
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Anonymous snapshots debounced from storefront carts — correlate with CRM outreach when email exists.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="max-w-md space-y-2">
        <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
          Search
        </Label>
        <Input
          placeholder="Session id, email, or last path…"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Hint total</th>
                <th className="px-4 py-3 font-medium">Last path</th>
                <th className="px-4 py-3 font-medium">Idle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-4">
                        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => {
                    const idleMin = Math.round(
                      (Date.now() - new Date(r.updatedAt).getTime()) / 60000
                    );
                    return (
                      <tr key={r.sessionId} className="hover:bg-zinc-800/40">
                        <td className="px-4 py-4 font-mono text-xs text-zinc-300">
                          {r.sessionId.slice(0, 14)}…
                        </td>
                        <td className="px-4 py-4 text-zinc-200">
                          {r.userEmail ?? "—"}
                        </td>
                        <td className="px-4 py-4 tabular-nums text-zinc-300">
                          {r.itemCount}
                        </td>
                        <td className="px-4 py-4 tabular-nums text-zinc-300">
                          {formatInr(r.subtotalHint) ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-500">
                          {r.lastPath || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-amber-200/90">
                          {idleMin} min
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingCart}
            title={
              search.trim()
                ? "No carts match this search"
                : "No abandoned carts with items"
            }
            description={
              search.trim()
                ? "Try another session fragment, email, or URL path."
                : "Telemetry only lists sessions with at least one line item."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="telemetry rows"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </div>
  );
}
