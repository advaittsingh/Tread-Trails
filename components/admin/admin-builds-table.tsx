"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers } from "lucide-react";

import { cars } from "@/data/cars";
import type { Build } from "@/data/types";
import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";

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
  legacyId: string | null;
  build: Build;
};

function parseTokens(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyForm() {
  return {
    slug: "",
    title: "",
    vehicleSlug: "",
    summary: "",
    description: "",
    beforeImage: "",
    afterImage: "",
    galleryStr: "",
    productIdsStr: "",
    legacyId: "",
    homeSpotlightRankStr: "",
  };
}

export function AdminBuildsTable() {
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingInternalId, setEditingInternalId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState(emptyForm);
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
      const res = await fetch(`/api/admin/portfolio-builds/${internalId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load build");
      const b = data.build as Build;
      const legacyIdField =
        typeof data.legacyId === "string" ? data.legacyId : "";
      setForm({
        slug: b.slug,
        title: b.title,
        vehicleSlug: b.vehicleSlug,
        summary: b.summary ?? "",
        description: b.description ?? "",
        beforeImage: b.beforeImage,
        afterImage: b.afterImage,
        galleryStr: (b.gallery ?? []).join(", "),
        productIdsStr: (b.productIds ?? []).join(", "),
        legacyId: legacyIdField,
        homeSpotlightRankStr:
          b.homeSpotlightRank != null ? String(b.homeSpotlightRank) : "",
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Load failed");
      setForm(emptyForm());
    } finally {
      setFormLoading(false);
    }
  }

  function parseSpotlightRank(): { ok: true; value: number | null | undefined } | { ok: false; message: string } {
    const rs = form.homeSpotlightRankStr.trim();
    if (rs === "") {
      return {
        ok: true,
        value: editingInternalId ? null : undefined,
      };
    }
    const n = Number.parseInt(rs, 10);
    if (Number.isNaN(n) || n < 0) {
      return {
        ok: false,
        message: "Home spotlight rank must be a non‑negative integer or blank.",
      };
    }
    return { ok: true, value: n };
  }

  async function saveBuild() {
    setSaving(true);
    setFormError(null);

    const gallery = parseTokens(form.galleryStr);
    const productIds = parseTokens(form.productIdsStr);
    const spotlight = parseSpotlightRank();
    if (!spotlight.ok) {
      setFormError(spotlight.message);
      setSaving(false);
      return;
    }

    try {
      if (editingInternalId) {
        const body: Record<string, unknown> = {
          slug: form.slug.trim(),
          title: form.title.trim(),
          vehicleSlug: form.vehicleSlug.trim(),
          summary: form.summary,
          description: form.description,
          beforeImage: form.beforeImage.trim(),
          afterImage: form.afterImage.trim(),
          gallery,
          productIds,
          homeSpotlightRank: spotlight.value ?? null,
        };
        if (form.legacyId.trim()) body.legacyId = form.legacyId.trim();
        else body.legacyId = null;

        const res = await fetch(`/api/admin/portfolio-builds/${editingInternalId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error ??
              data.detail ??
              (typeof data.details === "object"
                ? JSON.stringify(data.details)
                : "Update failed")
          );
        }
      } else {
        const body: Record<string, unknown> = {
          slug: form.slug.trim(),
          title: form.title.trim(),
          vehicleSlug: form.vehicleSlug.trim(),
          summary: form.summary,
          description: form.description,
          beforeImage: form.beforeImage.trim(),
          afterImage: form.afterImage.trim(),
          gallery,
          productIds,
        };
        if (form.legacyId.trim()) body.legacyId = form.legacyId.trim();
        if (spotlight.value !== undefined) {
          body.homeSpotlightRank = spotlight.value;
        }

        if (!body.slug || !body.title) {
          setFormError("Slug and title are required.");
          setSaving(false);
          return;
        }

        const res = await fetch(`/api/admin/portfolio-builds`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error ??
              data.detail ??
              (typeof data.details === "object"
                ? JSON.stringify(data.details)
                : "Create failed")
          );
        }
      }

      setSheetOpen(false);
      await load();
      toastSuccess(
        editingInternalId ? "Build updated" : "Build created",
        form.slug.trim()
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save build", msg);
    } finally {
      setSaving(false);
    }
  }

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
      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            Portfolio builds
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            <span className="font-medium text-zinc-200">New build</span> → POST{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">
              /api/admin/portfolio-builds
            </code>
            . Row <span className="font-medium text-zinc-200">Edit</span> → GET + PATCH{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">
              /api/admin/portfolio-builds/[id]
            </code>
            . <span className="font-medium text-zinc-200">Delete</span> → DELETE (confirmation modal).
            Vehicle slug must exist on Vehicle; product refs = slug / internal id / legacyId (comma-separated).
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="bg-emerald-600 text-white hover:bg-emerald-500"
        >
          New build
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          showCloseButton
          className="w-full border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-xl"
        >
          <SheetHeader>
            <SheetTitle className="text-white">
              {editingInternalId ? "Edit build" : "New build"}
            </SheetTitle>
            <SheetDescription className="text-zinc-500">
              Maps to PortfolioBuild + PortfolioBuildProduct joins. Mirrors storefront{" "}
              <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">/build/[slug]</code>.
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
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                    placeholder="hilux-arctic-runner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Vehicle slug</Label>
                  <Input
                    value={form.vehicleSlug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vehicleSlug: e.target.value }))
                    }
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                    placeholder="toyota-hilux"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Summary</Label>
                  <textarea
                    value={form.summary}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, summary: e.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Description</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={6}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Before image URL</Label>
                  <Input
                    value={form.beforeImage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, beforeImage: e.target.value }))
                    }
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">After image URL</Label>
                  <Input
                    value={form.afterImage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, afterImage: e.target.value }))
                    }
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Gallery URLs (comma / newline separated)
                  </Label>
                  <textarea
                    value={form.galleryStr}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, galleryStr: e.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Linked products (slug, id, or legacyId — comma separated)
                  </Label>
                  <textarea
                    value={form.productIdsStr}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, productIdsStr: e.target.value }))
                    }
                    rows={3}
                    placeholder="product-slug-a, product-slug-b"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Legacy ID (optional)</Label>
                  <Input
                    value={form.legacyId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, legacyId: e.target.value }))
                    }
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Home spotlight rank (optional, blank = not featured; edit: blank clears)
                  </Label>
                  <Input
                    value={form.homeSpotlightRankStr}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        homeSpotlightRankStr: e.target.value,
                      }))
                    }
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                    placeholder="0 = highest priority when set"
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
              onClick={() => void saveBuild()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
