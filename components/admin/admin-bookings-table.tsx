"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import { useConfirmation } from "@/contexts/confirmation-context";
import { toastError, toastSuccess } from "@/lib/toast";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
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
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  vehicleName: string;
  vehicleSlug?: string;
  service: string;
  date: string;
  time: string;
  status: string;
  createdAt?: string;
};

type Detail = Row & { userId?: string | null; updatedAt?: string };

export function AdminBookingsTable() {
  const { confirmAction } = useConfirmation();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) qs.set("search", search.trim());
      if (status) qs.set("status", status);

      const res = await fetch(`/api/admin/bookings?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load bookings");
      setRows(data.bookings as Row[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setRows([]);
      toastError("Could not load bookings", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

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
        const res = await fetch(`/api/admin/bookings/${detailId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        if (!cancelled) setDetail(data.booking as Detail);
      } catch (e) {
        if (!cancelled) {
          toastError(
            "Could not load booking",
            e instanceof Error ? e.message : "Error"
          );
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

  async function patchStatus(id: string, nextStatus: string, prevStatus: string) {
    if (nextStatus === prevStatus) return;
    if (nextStatus === "cancelled") {
      const ok = await confirmAction({
        title: "Cancel this booking?",
        description: "Marks the bay request as cancelled for the team.",
        confirmLabel: "Mark cancelled",
        cancelLabel: "Keep status",
        contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
      });
      if (!ok) return;
    }
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
      if (detailId === id) {
        setDetail((d) => (d ? { ...d, status: nextStatus } : d));
      }
      toastSuccess("Booking updated", nextStatus);
    } catch (e) {
      toastError(
        "Could not update booking",
        e instanceof Error ? e.message : "Error"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const exportRows = rows.map((r) => [
    r.id,
    r.contactName,
    r.contactEmail,
    r.contactPhone,
    r.vehicleName,
    r.service,
    r.date,
    r.time,
    r.status,
    r.createdAt ?? "",
  ]);

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            Bookings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Installation & bay scheduling — update status when the studio confirms slots.
          </p>
        </div>
        <AdminExportButton
          filename="bookings.csv"
          headers={[
            "id",
            "name",
            "email",
            "phone",
            "vehicle",
            "service",
            "date",
            "time",
            "status",
            "created",
          ]}
          rows={exportRows}
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
            className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">All</option>
            <option value="requested">Requested</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="max-w-md min-w-[220px] flex-1 space-y-2">
          <label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Search
          </label>
          <Input
            placeholder="Email, vehicle, service…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Slot</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4" colSpan={8}>
                        <Skeleton className="h-10 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-4 font-mono text-xs text-zinc-300">
                        {r.id.slice(-10)}
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-zinc-100">{r.contactEmail}</p>
                        <p className="text-xs text-zinc-500">{r.contactName}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-300">
                        {r.contactPhone || "—"}
                      </td>
                      <td className="px-4 py-4 text-zinc-200">{r.vehicleName}</td>
                      <td className="px-4 py-4 text-zinc-300">{r.service}</td>
                      <td className="px-4 py-4 text-xs text-zinc-400">
                        {r.date} · {r.time}
                      </td>
                      <td className="px-4 py-4">
                        <AdminStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            disabled={updatingId === r.id}
                            value={r.status}
                            onChange={(e) =>
                              void patchStatus(r.id, e.target.value, r.status)
                            }
                            className="h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
                          >
                            <option value="requested">Requested</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 text-xs text-zinc-400 hover:text-emerald-300"
                            onClick={() => setDetailId(r.id)}
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={CalendarClock}
            title={
              status || search.trim()
                ? "No bookings match these filters"
                : "No bay requests yet"
            }
            description={
              status || search.trim()
                ? "Clear status or search to see the full queue."
                : "Installation requests from the booking wizard will land here."
            }
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="bookings"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      <Sheet open={Boolean(detailId)} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent
          showCloseButton
          className="flex h-full w-full max-w-full flex-col gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100 sm:max-w-2xl lg:max-w-[44rem]"
        >
          <SheetHeader className="shrink-0 border-b border-zinc-800 px-6 py-5 text-left">
            <SheetTitle className="font-heading text-xl tracking-tight text-white">
              Booking detail
            </SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {detailLoading ? (
            <Skeleton className="h-40 w-full rounded-xl bg-zinc-800" />
          ) : detail ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <DetailRow label="ID" value={detail.id} mono />
              <DetailRow label="Status" value={detail.status} />
              <DetailRow label="Name" value={detail.contactName} />
              <DetailRow label="Email" value={detail.contactEmail} />
              <DetailRow label="Phone" value={detail.contactPhone} />
              <DetailRow label="Vehicle" value={detail.vehicleName} />
              <DetailRow
                label="Vehicle slug"
                value={detail.vehicleSlug ?? "—"}
                mono
              />
              <DetailRow label="Service" value={detail.service} />
              <DetailRow label="Slot" value={`${detail.date} · ${detail.time}`} />
              {detail.userId ? (
                <DetailRow label="User ID" value={detail.userId} mono />
              ) : null}
            </dl>
          ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-zinc-500 uppercase">{label}</dt>
      <dd className={`mt-1 text-zinc-200 ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
