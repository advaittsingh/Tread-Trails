"use client";

import { useCallback, useEffect, useState } from "react";
import { UsersRound } from "lucide-react";

import { toastError, toastSuccess } from "@/lib/toast";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminExportButton } from "@/components/admin/admin-export-button";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
};

export function AdminUsersPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    preferredVehicleSlug: string | null;
    wishlistSlugs: string[];
    savedVehicleSlugs: string[];
    orders: { id: string; total: number; status: string; createdAt: string }[];
    bookings: {
      id: string;
      vehicleName: string;
      service: string;
      status: string;
      date: string;
      time: string;
    }[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) qs.set("search", search.trim());

      const res = await fetch(`/api/admin/users?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users");
      setRows(data.users as Row[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setRows([]);
      toastError("Could not load users", msg);
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

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${detailId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        if (!cancelled) setDetail(data.user);
      } catch (e) {
        if (!cancelled) {
          toastError("User", e instanceof Error ? e.message : "Error");
          setDetailId(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  async function updateRole(userId: string, role: "user" | "admin") {
    setRoleUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toastSuccess("Role updated", role);
      await load();
      setDetail((d) => (d ? { ...d, role } : d));
    } catch (e) {
      toastError("Role", e instanceof Error ? e.message : "Error");
    } finally {
      setRoleUpdating(false);
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            Users
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Identity roster — open details for orders, bookings, and role management.
          </p>
        </div>
        <AdminExportButton
          filename="users.csv"
          headers={["id", "name", "email", "role", "joined"]}
          rows={rows.map((r) => [
            r.id,
            r.name,
            r.email,
            r.role,
            r.createdAt ?? "",
          ])}
          disabled={loading}
        />
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="max-w-md space-y-2">
        <label className="text-[11px] tracking-wide text-zinc-500 uppercase">
          Search
        </label>
        <Input
          placeholder="Email, name, or id…"
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
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-4">
                        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-4">
                        <p className="font-medium text-zinc-100">{r.name}</p>
                        <p className="font-mono text-xs text-zinc-600">
                          {r.id.slice(-8)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-zinc-300">{r.email}</td>
                      <td className="px-4 py-4">
                        <AdminStatusBadge status={r.role} />
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-500">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-zinc-400 hover:text-emerald-300"
                          onClick={() => setDetailId(r.id)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={UsersRound}
            title={
              search.trim() ? "No users match this search" : "No users yet"
            }
            description={
              search.trim()
                ? "Try a different email fragment or id."
                : "Accounts appear after sign-up."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="users"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      <Sheet open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-white">User detail</SheetTitle>
          </SheetHeader>
          {detailLoading ? (
            <Skeleton className="mt-6 h-40 w-full bg-zinc-800" />
          ) : detail ? (
            <div className="mt-6 space-y-6 text-sm">
              <p className="font-medium text-zinc-100">{detail.name}</p>
              <p className="text-zinc-400">{detail.email}</p>
              {detail.phone ? (
                <p className="text-zinc-400">{detail.phone}</p>
              ) : null}
              <div className="flex items-center gap-2">
                <select
                  disabled={roleUpdating}
                  value={detail.role}
                  onChange={(e) =>
                    void updateRole(
                      detail.id,
                      e.target.value as "user" | "admin"
                    )
                  }
                  className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              {detail.preferredVehicleSlug ? (
                <p className="text-xs text-zinc-500">
                  Preferred vehicle: {detail.preferredVehicleSlug}
                </p>
              ) : null}
              <section>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Recent orders ({detail.orders.length})
                </p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  {detail.orders.map((o) => (
                    <li key={o.id}>
                      {o.id.slice(-8)} · {o.status} · ₹{o.total}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Recent bookings ({detail.bookings.length})
                </p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  {detail.bookings.map((b) => (
                    <li key={b.id}>
                      {b.vehicleName} · {b.date} {b.status}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                  Wishlist ({detail.wishlistSlugs.length})
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {detail.wishlistSlugs.join(", ") || "—"}
                </p>
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
