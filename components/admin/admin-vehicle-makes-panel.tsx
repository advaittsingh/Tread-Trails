"use client";

import { useCallback, useEffect, useState } from "react";

import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminInputClass } from "@/components/admin/admin-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory } from "lucide-react";

type MakeRow = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  _count?: { models: number };
};

export function AdminVehicleMakesPanel() {
  const { confirmDelete } = useConfirmation();
  const [rows, setRows] = useState<MakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({ slug: "", name: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/admin/vehicle-makes?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(data.makes as MakeRow[]);
    } catch (e) {
      toastError("Could not load brands", e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function createMake() {
    if (!draft.slug.trim() || !draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vehicle-makes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: draft.slug.trim().toLowerCase(),
          name: draft.name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setDraft({ slug: "", name: "" });
      toastSuccess("Brand created", data.make.name);
      await load();
    } catch (e) {
      toastError("Create failed", e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMake(id: string, label: string) {
    const ok = await confirmDelete({
      title: "Delete this OEM brand?",
      description: "All models under this brand are removed. Vehicle platforms are unlinked, not deleted.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/vehicle-makes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toastSuccess("Brand deleted", label);
      await load();
    } catch (e) {
      toastError("Delete failed", e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="min-w-[140px] flex-1 space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Slug</Label>
          <Input
            placeholder="toyota"
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
            className={adminInputClass}
          />
        </div>
        <div className="min-w-[160px] flex-[2] space-y-1">
          <Label className="text-[11px] uppercase text-zinc-500">Display name</Label>
          <Input
            placeholder="Toyota"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className={adminInputClass}
          />
        </div>
        <Button
          type="button"
          onClick={() => void createMake()}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          {saving ? "Saving…" : "Add brand"}
        </Button>
      </div>

      <div className="min-w-[200px] max-w-sm space-y-1">
        <Label className="text-[11px] uppercase text-zinc-500">Filter</Label>
        <Input
          placeholder="Search brands…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={adminInputClass}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Models</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <Skeleton className="h-8 w-full bg-zinc-800" />
                    </td>
                  </tr>
                ))
              : rows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-emerald-300/90">{r.slug}</td>
                    <td className="px-4 py-3 text-zinc-100">{r.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{r._count?.models ?? 0}</td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-rose-900/60 text-rose-300"
                        onClick={() => void deleteMake(r.id, r.name)}
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
            icon={Factory}
            title="No OEM brands"
            description="Add a brand or run hierarchy backfill from existing vehicle slugs."
          />
        ) : null}
      </div>
    </div>
  );
}
