"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Layers } from "lucide-react";

import { useVehicleCatalog } from "@/hooks/use-vehicle-catalog";
import type { Build } from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import { AdminPageHeader } from "@/components/admin/admin-form-ui";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type ListRow = {
  id: string;
  legacyId: string | null;
  build: Build;
};

export function AdminBuildsTable() {
  const { vehicles: cars } = useVehicleCatalog();
  const { confirmDelete } = useConfirmation();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) qs.set("search", search.trim());
      if (vehicleFilter.trim()) qs.set("vehicle", vehicleFilter.trim());

      const res = await fetch(`/api/admin/portfolio-builds?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load builds");
      setRows(data.builds as ListRow[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setRows([]);
      toastError("Could not load builds", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, vehicleFilter]);

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

  async function deleteBuild(internalId: string, slugLabel: string) {
    const confirmed = await confirmDelete({
      title: "Delete this portfolio build?",
      description:
        "Linked product join rows will be removed. Public /build pages read from this table when seeded.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeletingId(internalId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio-builds/${internalId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await load();
      toastSuccess("Build deleted", slugLabel);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
      toastError("Delete failed", msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <AdminPageHeader
        title="Portfolio builds"
        description="Case studies on the storefront — before/after gallery and linked catalog SKUs."
        action={
          <Link href="/admin/builds/new" className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-500">New build</Link>
        }
      />

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-6">
        <div className="min-w-[220px] max-w-md flex-1 space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Search
          </Label>
          <Input
            placeholder="Slug, title, or vehicle slug…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="min-w-[200px] max-w-xs space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Vehicle
          </Label>
          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">All platforms</option>
            {cars.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Spotlight</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4" colSpan={5}>
                        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className="max-w-[160px] truncate px-4 py-4 font-mono text-xs text-emerald-300/90">
                        {r.build.slug}
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-4 text-zinc-100">
                        {r.build.title}
                      </td>
                      <td className="px-4 py-4 text-zinc-400">
                        {r.build.vehicleSlug}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-zinc-400">
                        {r.build.homeSpotlightRank ?? "—"}
                      </td>
                      <td className="space-x-2 whitespace-nowrap px-4 py-4">
                        <Link
                          href={`/admin/builds/${r.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-600 bg-zinc-950 px-3 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
                        >
                          Edit
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-rose-900/60 bg-zinc-950 text-rose-300 hover:bg-rose-950/40"
                          disabled={deletingId === r.id}
                          aria-label={`Delete build ${r.build.slug}`}
                          onClick={() => deleteBuild(r.id, r.build.slug)}
                        >
                          {deletingId === r.id ? "Deleting…" : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={Layers}
            title={
              search.trim() || vehicleFilter.trim()
                ? "No builds match these filters"
                : "No portfolio builds yet"
            }
            description={
              search.trim() || vehicleFilter.trim()
                ? "Adjust search or vehicle filter."
                : "Use New build above or run your seed script."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="builds"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

    </div>
  );
}
