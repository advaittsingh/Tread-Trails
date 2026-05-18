"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useConfirmation } from "@/contexts/confirmation-context";
import { formatInr } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminExportButton } from "@/components/admin/admin-export-button";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { buttonVariants } from "@/components/ui/button";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Row = {
  id: string;
  customerEmail: string;
  customerName: string;
  total: number;
  status: string;
  paymentMethod?: string;
  createdAt?: string;
};

export function AdminOrdersTable() {
  const { confirmAction } = useConfirmation();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [status, setStatus] = useState<string>("");
  const [payment, setPayment] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) qs.set("status", status);
      if (payment) qs.set("payment", payment);
      if (search.trim()) qs.set("search", search.trim());

      const res = await fetch(`/api/admin/orders?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load orders");
      setRows(data.orders as Row[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setRows([]);
      toastError("Could not load orders", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, payment, search]);

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

  async function patchStatus(id: string, nextStatus: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
      toastSuccess("Order updated", `Status: ${nextStatus}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed";
      setError(msg);
      toastError("Could not update order", msg);
    } finally {
      setUpdatingId(null);
    }
  }

  async function onStatusChange(id: string, prevStatus: string, nextStatus: string) {
    if (nextStatus === prevStatus) return;
    if (nextStatus === "cancelled") {
      const ok = await confirmAction({
        title: "Mark this order as cancelled?",
        description:
          "Updates fulfilment state for the team. Payment capture is not reversed here.",
        confirmLabel: "Mark cancelled",
        cancelLabel: "Keep current status",
        contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
      });
      if (!ok) return;
    }
    await patchStatus(id, nextStatus);
  }

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            Orders
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Filter by fulfilment state — open details for line items, shipping, and PSP ids.
          </p>
        </div>
        <AdminExportButton
          filename="orders.csv"
          headers={["id", "email", "name", "total", "status", "payment", "created"]}
          rows={rows.map((r) => [
            r.id,
            r.customerEmail,
            r.customerName,
            r.total,
            r.status,
            r.paymentMethod ?? "",
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

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-brand-maroon-light/40"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Payment
          </label>
          <select
            value={payment}
            onChange={(e) => {
              setPayment(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-brand-maroon-light/40"
          >
            <option value="">All</option>
            <option value="stripe">Stripe</option>
            <option value="razorpay">Razorpay</option>
            <option value="juspay">Juspay</option>
            <option value="cod">COD</option>
          </select>
        </div>
        <div className="min-w-[220px] flex-1 space-y-2">
          <label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Search
          </label>
          <Input
            placeholder="Email, name, or Order ID…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4" colSpan={7}>
                        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-4 font-mono text-xs">
                        <Link
                          href={`/admin/orders/${r.id}`}
                          className="text-brand-gold-dark/90 hover:text-brand-gold-dark hover:underline"
                        >
                          {r.id.slice(-10)}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-zinc-100">{r.customerEmail}</p>
                        <p className="text-xs text-zinc-500">{r.customerName}</p>
                      </td>
                      <td className="px-4 py-4 tabular-nums text-zinc-200">
                        {formatInr(r.total) ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <AdminStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-4 capitalize text-zinc-400">
                        {r.paymentMethod ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-500">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            disabled={updatingId === r.id}
                            value={r.status}
                            onChange={(e) =>
                              void onStatusChange(r.id, r.status, e.target.value)
                            }
                            className="h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:ring-2 focus:ring-brand-maroon-light/40 disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <Link
                            href={`/admin/orders/${r.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                              className:
                                "h-9 text-xs text-zinc-400 hover:text-brand-gold-dark",
                            })}
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingBag}
            title={
              status || payment || search.trim()
                ? "No orders match these filters"
                : "No orders yet"
            }
            description={
              status || payment || search.trim()
                ? "Try clearing status, payment, or search."
                : "Paid and COD checkouts will appear here once customers complete checkout."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="orders"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

    </div>
  );
}
