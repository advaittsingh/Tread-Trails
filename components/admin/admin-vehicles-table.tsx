"use client";

import { useCallback, useEffect, useState } from "react";
import { Truck } from "lucide-react";

import type { Car } from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  VEHICLE_CATEGORY_ORDER,
  type VehicleCategory,
} from "@/lib/vehicle-categories";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

type ListRow = {
  id: string;
  vehicle: Car;
};

type VehicleFormState = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  thumbnail: string;
  category: VehicleCategory;
  engineSummary: string;
  modelYearsLabel: string;
  trimSummary: string;
  legacyId: string;
};

function emptyForm(): VehicleFormState {
  return {
    slug: "",
    name: "",
    tagline: "",
    description: "",
    heroImage: "",
    thumbnail: "",
    category: VEHICLE_CATEGORY_ORDER[0],
    engineSummary: "",
    modelYearsLabel: "",
    trimSummary: "",
    legacyId: "",
  };
}

function apiErrorMessage(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.details === "object" && data.details !== null) {
    return JSON.stringify(data.details);
  }
  return fallback;
}

const inputClass = "border-zinc-700 bg-zinc-900 text-zinc-100";
const textareaClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40";

export function AdminVehiclesTable() {
  const { confirmDelete } = useConfirmation();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInternalId, setEditingInternalId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleFormState>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
  }, [page, limit, search, categoryFilter]);

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

  function openCreate() {
    setEditingInternalId(null);
    setForm(emptyForm());
    setFormError(null);
    setSheetOpen(true);
  }

  async function openEdit(internalId: string) {
    setEditingInternalId(internalId);
    setFormError(null);
    setFormLoading(true);
    setSheetOpen(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${internalId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load vehicle");
      const v = data.vehicle as Car;
      const rowId = typeof data.id === "string" ? data.id : internalId;
      const legacyIdField = v.id !== rowId ? v.id : "";
      setForm({
        slug: v.slug,
        name: v.name,
        tagline: v.tagline ?? "",
        description: v.description ?? "",
        heroImage: v.heroImage,
        thumbnail: v.thumbnail,
        category: v.category as VehicleCategory,
        engineSummary: v.engineSummary ?? "",
        modelYearsLabel: v.modelYearsLabel ?? "",
        trimSummary: v.trimSummary ?? "",
        legacyId: legacyIdField,
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Load failed");
      setForm(emptyForm());
    } finally {
      setFormLoading(false);
    }
  }

  async function saveVehicle() {
    setSaving(true);
    setFormError(null);

    if (!form.slug.trim() || !form.name.trim()) {
      setFormError("Slug and name are required.");
      setSaving(false);
      return;
    }
    if (!form.heroImage.trim() || !form.thumbnail.trim()) {
      setFormError("Hero image and thumbnail URLs are required.");
      setSaving(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        tagline: form.tagline,
        description: form.description,
        heroImage: form.heroImage.trim(),
        thumbnail: form.thumbnail.trim(),
        category: form.category,
        engineSummary: form.engineSummary,
        modelYearsLabel: form.modelYearsLabel,
        trimSummary: form.trimSummary,
      };

      if (editingInternalId) {
        if (form.legacyId.trim()) payload.legacyId = form.legacyId.trim();
        else payload.legacyId = null;

        const res = await fetch(`/api/admin/vehicles/${editingInternalId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(apiErrorMessage(data, "Update failed"));
        }
      } else {
        if (form.legacyId.trim()) payload.legacyId = form.legacyId.trim();

        const res = await fetch(`/api/admin/vehicles`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(apiErrorMessage(data, "Create failed"));
        }
      }

      setSheetOpen(false);
      await load();
      toastSuccess(
        editingInternalId ? "Vehicle updated" : "Vehicle created",
        form.slug.trim()
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save vehicle", msg);
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            Vehicles
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Platform hubs for{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">
              /vehicles/[slug]
            </code>
            . CRUD via{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">
              /api/admin/vehicles
            </code>{" "}
            and{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">
              /api/admin/vehicles/[id]
            </code>
            .
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="bg-emerald-600 text-white hover:bg-emerald-500"
        >
          New vehicle
        </Button>
      </header>

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
            className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">All categories</option>
            {VEHICLE_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4" colSpan={4}>
                        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className="max-w-[180px] truncate px-4 py-4 font-mono text-xs text-emerald-300/90">
                        {r.vehicle.slug}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-4 text-zinc-100">
                        {r.vehicle.name}
                      </td>
                      <td className="px-4 py-4 text-zinc-400">{r.vehicle.category}</td>
                      <td className="space-x-2 whitespace-nowrap px-4 py-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-zinc-600 bg-zinc-950 text-zinc-200"
                          onClick={() => openEdit(r.id)}
                        >
                          Edit
                        </Button>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          showCloseButton
          className="w-full border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-xl"
        >
          <SheetHeader>
            <SheetTitle className="text-white">
              {editingInternalId ? "Edit vehicle" : "New vehicle"}
            </SheetTitle>
            <SheetDescription className="text-zinc-500">
              Maps to the Vehicle table. Public catalog uses slug for hub URLs.
            </SheetDescription>
          </SheetHeader>

          {formError ? (
            <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {formError}
            </p>
          ) : null}

          {formLoading ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-10 w-full bg-zinc-800" />
              <Skeleton className="h-10 w-full bg-zinc-800" />
              <Skeleton className="h-10 w-full bg-zinc-800" />
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-220px)] pr-3">
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="toyota-hilux"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Tagline</Label>
                  <Input
                    value={form.tagline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tagline: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Description</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={5}
                    className={textareaClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Hero image URL</Label>
                  <Input
                    value={form.heroImage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, heroImage: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Thumbnail URL</Label>
                  <Input
                    value={form.thumbnail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, thumbnail: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Category</Label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as VehicleCategory,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {VEHICLE_CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Engine summary</Label>
                  <textarea
                    value={form.engineSummary}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, engineSummary: e.target.value }))
                    }
                    rows={3}
                    className={textareaClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Model years label</Label>
                  <Input
                    value={form.modelYearsLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, modelYearsLabel: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="2016–2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Trim summary</Label>
                  <textarea
                    value={form.trimSummary}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, trimSummary: e.target.value }))
                    }
                    rows={3}
                    className={textareaClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Legacy ID (optional)</Label>
                  <Input
                    value={form.legacyId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, legacyId: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="Static catalog id when migrating"
                  />
                </div>
              </div>
            </ScrollArea>
          )}

          <SheetFooter className="gap-2 border-t border-zinc-800 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-600 bg-zinc-950 text-zinc-200"
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || formLoading}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={() => void saveVehicle()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
