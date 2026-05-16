"use client";

import { useCallback, useEffect, useState } from "react";
import { Tags } from "lucide-react";

import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";

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
} from "@/components/admin/admin-edit-sheet";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <AdminPageHeader
        title="Brands"
        description="Supplier logos and catalog grouping. Product counts update automatically from linked SKUs."
        action={
          <Button
            type="button"
            onClick={openCreate}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            New brand
          </Button>
        }
      />

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

      <AdminEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editingId ? "Edit brand" : "New brand"}
        subtitle="Shown in catalog filters and product cards."
        formError={formError}
        loading={formLoading}
        loadingSkeleton={
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
            <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
          </div>
        }
        footer={
          <AdminSheetFooterButtons
            onCancel={() => setSheetOpen(false)}
            onSave={() => void saveBrand()}
            saving={saving}
            saveDisabled={formLoading}
          />
        }
      >
        <AdminFormStack>
          <AdminFormSection title="Identity" description="Slug and display name.">
            <AdminFieldGrid>
              <AdminField label="URL slug" hint="Lowercase, hyphenated.">
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className={adminInputClass}
                  placeholder="arb"
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
          </AdminFormSection>
          <AdminFormSection title="Presentation" description="Logo and list order.">
            <AdminField label="Logo URL">
              <Input
                value={form.logoSrc}
                onChange={(e) =>
                  setForm((f) => ({ ...f, logoSrc: e.target.value }))
                }
                className={adminInputClass}
              />
            </AdminField>
            <AdminField label="Sort order" hint="Lower numbers appear first.">
              <Input
                value={form.sortOrderStr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrderStr: e.target.value }))
                }
                className={adminInputClass}
                placeholder="0"
              />
            </AdminField>
          </AdminFormSection>
        </AdminFormStack>
      </AdminEditSheet>
    </div>
  );
}
