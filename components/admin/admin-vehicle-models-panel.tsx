"use client";

import { useCallback, useEffect, useState } from "react";

import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminInputClass, adminSelectClass } from "@/components/admin/admin-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CarFront } from "lucide-react";

type MakeOption = { id: string; slug: string; name: string };
type ModelRow = {
  id: string;
  slug: string;
  name: string;
  makeId: string;
  make: MakeOption;
  _count?: { vehicles: number };
};

export function AdminVehicleModelsPanel() {
  const { confirmDelete } = useConfirmation();
  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [rows, setRows] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMakeId, setFilterMakeId] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({ makeId: "", slug: "", name: "" });
  const [saving, setSaving] = useState(false);

  const loadMakes = useCallback(async () => {
    const res = await fetch("/api/admin/vehicle-makes", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setMakes(data.makes as MakeOption[]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterMakeId) qs.set("makeId", filterMakeId);
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/admin/vehicle-models?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(data.models as ModelRow[]);
    } catch (e) {
      toastError("Could not load models", e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filterMakeId, search]);

  useEffect(() => {
    void loadMakes();
  }, [loadMakes]);

  useEffect(() => {
    load();
  }, [load]);

  async function createModel() {
    if (!draft.makeId || !draft.slug.trim() || !draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vehicle-models", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          makeId: draft.makeId,
          slug: draft.slug.trim().toLowerCase(),
          name: draft.name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setDraft((d) => ({ ...d, slug: "", name: "" }));
      toastSuccess("Model created", data.model.name);
      await load();
    } catch (e) {
      toastError("Create failed", e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteModel(id: string, label: string) {
    const ok = await confirmDelete({
      title: "Delete this model line?",
      description: "Linked platforms are unlinked (modelId cleared), not deleted.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/vehicle-models/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toastSuccess("Model deleted", label);
      await load();
    } catch (e) {
      toastError("Delete failed", e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="min-w-[160px] space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Brand</Label>
          <select
            value={draft.makeId}
            onChange={(e) => setDraft((d) => ({ ...d, makeId: e.target.value }))}
            className={adminSelectClass}
          >
            <option value="">Select brand…</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1 space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Slug</Label>
          <Input
            placeholder="fortuner"
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
            className={adminInputClass}
          />
        </div>
        <div className="min-w-[160px] flex-[2] space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Display name</Label>
          <Input
            placeholder="Fortuner"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className={adminInputClass}
          />
        </div>
        <Button
          type="button"
          onClick={() => void createModel()}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {saving ? "Saving…" : "Add model"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[180px] space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Filter by brand</Label>
          <select
            value={filterMakeId}
            onChange={(e) => setFilterMakeId(e.target.value)}
            className={adminSelectClass}
          >
            <option value="">All brands</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Search</Label>
          <Input
            placeholder="Model name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={adminInputClass}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Platforms</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <Skeleton className="h-8 w-full bg-zinc-800" />
                    </td>
                  </tr>
                ))
              : rows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-400">{r.make.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-300/90">{r.slug}</td>
                    <td className="px-4 py-3 text-zinc-100">{r.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{r._count?.vehicles ?? 0}</td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-rose-900/60 text-rose-300"
                        onClick={() => void deleteModel(r.id, r.name)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={CarFront}
            title="No models"
            description="Create a model under a brand, then link platform variants."
          />
        ) : null}
      </div>
    </div>
  );
}
