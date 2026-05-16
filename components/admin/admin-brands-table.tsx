"use client";

import { useCallback, useEffect, useState } from "react";
import { Tags } from "lucide-react";

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

type BrandRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoSrc: string;
  productCount: number;
  sortOrder: number;
};

function emptyForm() {
  return {
    slug: "",
    name: "",
    tagline: "",
    logoSrc: "",
    sortOrderStr: "0",
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

export function AdminBrandsTable() {
  const { confirmDelete } = useConfirmation();
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

      const res = await fetch(`/api/admin/brands?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load brands");
      setRows(data.brands as BrandRow[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setRows([]);
      toastError("Could not load brands", msg);
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    setFormError(null);
    setFormLoading(true);
    setSheetOpen(true);
    try {
      const res = await fetch(`/api/admin/brands/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load brand");
      const b = data.brand as BrandRow;
      setForm({
        slug: b.slug,
        name: b.name,
        tagline: b.tagline ?? "",
        logoSrc: b.logoSrc ?? "",
        sortOrderStr: String(b.sortOrder ?? 0),
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Load failed");
      setForm(emptyForm());
    } finally {
      setFormLoading(false);
    }
  }

  function parseSortOrder(): { ok: true; value: number } | { ok: false; message: string } {
    const raw = form.sortOrderStr.trim();
    const n = raw === "" ? 0 : Number.parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0 || n > 9999) {
      return { ok: false, message: "Sort order must be an integer from 0 to 9999." };
    }
    return { ok: true, value: n };
  }

  async function saveBrand() {
    setSaving(true);
    setFormError(null);

    if (!form.slug.trim() || !form.name.trim()) {
      setFormError("Slug and name are required.");
      setSaving(false);
      return;
    }

    const sort = parseSortOrder();
    if (!sort.ok) {
      setFormError(sort.message);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        tagline: form.tagline,
        logoSrc: form.logoSrc,
        sortOrder: sort.value,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/brands/${editingId}`, {
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
        const res = await fetch(`/api/admin/brands`, {
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
        editingId ? "Brand updated" : "Brand created",
        form.slug.trim()
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setFormError(msg);
      toastError("Could not save brand", msg);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(id: string, slugLabel: string) {
    const confirmed = await confirmDelete({
      title: "Delete this brand?",
      description:
        "Products may still reference this brand name as text. This removes the Brand row only.",
      contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
    });
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await load();
      toastSuccess("Brand deleted", slugLabel);
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
            Brands
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Supplier logos and catalog grouping. CRUD via{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">
              /api/admin/brands
            </code>{" "}
            and{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px]">
              /api/admin/brands/[id]
            </code>
            . Product count is recomputed on save (read-only here).
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="bg-emerald-600 text-white hover:bg-emerald-500"
        >
          New brand
        </Button>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="min-w-[220px] max-w-md space-y-2">
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

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Sort</th>
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
                        {r.slug}
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-4 text-zinc-100">
                        {r.name}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-zinc-400">
                        {r.productCount}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-zinc-400">
                        {r.sortOrder}
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
                          aria-label={`Delete brand ${r.slug}`}
                          onClick={() => deleteBrand(r.id, r.slug)}
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
            icon={Tags}
            title={search.trim() ? "No brands match search" : "No brands yet"}
            description={
              search.trim()
                ? "Try a different search term."
                : "Use New brand above or run your seed script."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="brands"
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
              {editingId ? "Edit brand" : "New brand"}
            </SheetTitle>
            <SheetDescription className="text-zinc-500">
              Maps to the Brand table. Product count updates automatically when products change.
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
                    placeholder="arb"
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
                  <Label className="text-zinc-400">Logo URL</Label>
                  <Input
                    value={form.logoSrc}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, logoSrc: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Sort order</Label>
                  <Input
                    value={form.sortOrderStr}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrderStr: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="0"
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
              onClick={() => void saveBrand()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
