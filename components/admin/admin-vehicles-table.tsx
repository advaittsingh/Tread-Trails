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
import {
  AdminEditSheet,
  AdminField,
  AdminFieldGrid,
  AdminFormSection,
  AdminFormStack,
  AdminPageHeader,
  AdminSheetFooterButtons,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/admin-edit-sheet";
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
      <AdminPageHeader
        title="Vehicles"
        description="Platform hubs on the storefront — each vehicle has its own catalog and build gallery."
        action={
          <Button
            type="button"
            onClick={openCreate}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            New vehicle
          </Button>
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

      <AdminEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editingInternalId ? "Edit vehicle" : "New vehicle"}
        subtitle="Published at /vehicles/[slug] on the storefront."
        formError={formError}
        loading={formLoading}
        loadingSkeleton={
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
            <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
          </div>
        }
        footer={
          <AdminSheetFooterButtons
            onCancel={() => setSheetOpen(false)}
            onSave={() => void saveVehicle()}
            saving={saving}
            saveDisabled={formLoading}
          />
        }
      >
        <AdminFormStack>
          <AdminFormSection title="Basics" description="Slug, name, and category.">
            <AdminFieldGrid>
              <AdminField label="URL slug" hint="Lowercase, hyphenated.">
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className={adminInputClass}
                  placeholder="toyota-hilux"
                />
              </AdminField>
              <AdminField label="Name">
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
            </AdminFieldGrid>
            <AdminField label="Tagline">
              <Input
                value={form.tagline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tagline: e.target.value }))
                }
                className={adminInputClass}
              />
            </AdminField>
            <AdminField label="Category">
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as VehicleCategory,
                  }))
                }
                className={adminSelectClass}
              >
                {VEHICLE_CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </AdminField>
          </AdminFormSection>

          <AdminFormSection title="Story" description="Hub page copy.">
            <AdminField label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
                className={adminTextareaClass}
              />
            </AdminField>
          </AdminFormSection>

          <AdminFormSection
            title="Images"
            description="Hero and thumbnail for listings."
            defaultOpen={false}
          >
            <AdminFieldGrid>
              <AdminField label="Hero image URL">
                <Input
                  value={form.heroImage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, heroImage: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
              <AdminField label="Thumbnail URL">
                <Input
                  value={form.thumbnail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, thumbnail: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
            </AdminFieldGrid>
          </AdminFormSection>

          <AdminFormSection
            title="Technical"
            description="Engine, years, and trim notes."
            defaultOpen={false}
          >
            <AdminField label="Engine summary">
              <textarea
                value={form.engineSummary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, engineSummary: e.target.value }))
                }
                rows={3}
                className={adminTextareaClass}
              />
            </AdminField>
            <AdminFieldGrid>
              <AdminField label="Model years" hint="e.g. 2016–2024">
                <Input
                  value={form.modelYearsLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, modelYearsLabel: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
              <AdminField label="Legacy ID" hint="Migration only.">
                <Input
                  value={form.legacyId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, legacyId: e.target.value }))
                  }
                  className={adminInputClass}
                />
              </AdminField>
            </AdminFieldGrid>
            <AdminField label="Trim summary">
              <textarea
                value={form.trimSummary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trimSummary: e.target.value }))
                }
                rows={3}
                className={adminTextareaClass}
              />
            </AdminField>
          </AdminFormSection>
        </AdminFormStack>
      </AdminEditSheet>
    </div>
  );
}
