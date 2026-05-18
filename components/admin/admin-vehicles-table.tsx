"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Truck } from "lucide-react";

import type { Car } from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";
import { VEHICLE_CATEGORY_ORDER } from "@/lib/vehicle-categories";

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
  vehicle: Car;
};

type MakeOption = { id: string; name: string };
type ModelOption = { id: string; name: string; makeId: string };

export function AdminVehiclesTable({ embedded = false }: { embedded?: boolean }) {
  const { confirmDelete } = useConfirmation();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
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
      if (categoryFilter.trim()) qs.set("category", categoryFilter.trim());
      if (makeFilter.trim()) qs.set("makeId", makeFilter.trim());
      if (modelFilter.trim()) qs.set("modelId", modelFilter.trim());

      const res = await fetch(`/api/admin/vehicles?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load vehicles");
      setRows(data.vehicles as ListRow[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setRows([]);
      toastError("Could not load vehicles", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categoryFilter, makeFilter, modelFilter]);

  useEffect(() => {
    async function loadFilters() {
      const [mkRes, mdRes] = await Promise.all([
        fetch("/api/admin/vehicle-makes", { credentials: "include" }),
        fetch("/api/admin/vehicle-models", { credentials: "include" }),
      ]);
      const mk = await mkRes.json();
      const md = await mdRes.json();
      if (mkRes.ok) setMakes(mk.makes as MakeOption[]);
      if (mdRes.ok) setModels(md.models as ModelOption[]);
    }
    void loadFilters();
  }, []);

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

  async function deleteVehicle(internalId: string, slugLabel: string) {
    const confirmed = await confirmDelete({
      title: "Delete this vehicle?",
      description:
        "Product compatibility links and portfolio builds referencing this platform may break. This cannot be undone.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeletingId(internalId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vehicles/${internalId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await load();
      toastSuccess("Vehicle deleted", slugLabel);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
      toastError("Delete failed", msg);
    } finally {
      setDeletingId(null);
    }
  }

  const wrapperClass = embedded ? "space-y-6" : "space-y-8 p-6 lg:p-10";

  return (
    <div className={wrapperClass}>
      {!embedded ? (
        <AdminPageHeader
          title="Vehicles"
          description="Platform hubs on the storefront — each vehicle has its own catalog and build gallery."
          action={
            <Link href="/admin/vehicles/new" className="inline-flex h-10 items-center justify-center rounded-md bg-brand-maroon-light px-4 text-sm font-medium text-white transition hover:bg-brand-maroon">New vehicle</Link>
          }
        />
      ) : null}

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
            placeholder="Slug or name…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="min-w-[200px] max-w-xs space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Category
          </Label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-brand-maroon-light/40"
          >
            <option value="">All categories</option>
            {VEHICLE_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px] max-w-xs space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">Brand</Label>
          <select
            value={makeFilter}
            onChange={(e) => {
              setMakeFilter(e.target.value);
              setModelFilter("");
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-brand-maroon-light/40"
          >
            <option value="">All brands</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px] max-w-xs space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">Model</Label>
          <select
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-brand-maroon-light/40"
          >
            <option value="">All models</option>
            {models
              .filter((m) => !makeFilter || m.makeId === makeFilter)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Brand / model</th>
                <th className="px-4 py-3 font-medium">Category</th>
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
                      <td className="max-w-[180px] truncate px-4 py-4 font-mono text-xs text-brand-gold-dark/90">
                        {r.vehicle.slug}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-4 text-zinc-100">
                        {r.vehicle.name}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-4 text-xs text-zinc-400">
                        {r.vehicle.makeName && r.vehicle.modelName
                          ? `${r.vehicle.makeName} · ${r.vehicle.modelName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-zinc-400">{r.vehicle.category}</td>
                      <td className="space-x-2 whitespace-nowrap px-4 py-4">
                        <Link
                          href={`/admin/vehicles/${r.id}`}
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
                          aria-label={`Delete vehicle ${r.vehicle.slug}`}
                          onClick={() => deleteVehicle(r.id, r.vehicle.slug)}
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
            icon={Truck}
            title={
              search.trim() || categoryFilter.trim()
                ? "No vehicles match these filters"
                : "No vehicles yet"
            }
            description={
              search.trim() || categoryFilter.trim()
                ? "Adjust search or category filter."
                : "Use New vehicle above or run your seed script."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="vehicles"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

    </div>
  );
}
