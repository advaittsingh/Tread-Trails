"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Tags } from "lucide-react";

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

type BrandRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoSrc: string;
  productCount: number;
  sortOrder: number;
};

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
          <Link href="/admin/brands/new" className="inline-flex h-10 items-center justify-center rounded-md bg-brand-maroon-light px-4 text-sm font-medium text-white transition hover:bg-brand-maroon">New brand</Link>
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
                      <td className="max-w-[160px] truncate px-4 py-4 font-mono text-xs text-brand-gold-dark/90">
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
                        <Link
                          href={`/admin/brands/${r.id}`}
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

    </div>
  );
}
