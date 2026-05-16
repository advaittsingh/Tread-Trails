"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type ErrorRow = {
  id: string;
  severity: string;
  category: string;
  source: string;
  route: string | null;
  message: string;
  stack: string | null;
  userId: string | null;
  createdAt: string;
};

const SEVERITIES = ["all", "fatal", "error", "warn", "info", "debug"] as const;
const CATEGORIES = [
  "all",
  "api",
  "auth",
  "payment",
  "booking",
  "webhook",
  "email",
  "system",
] as const;

function severityClass(s: string): string {
  switch (s) {
    case "fatal":
      return "bg-rose-500/25 text-rose-200 ring-rose-500/40";
    case "error":
      return "bg-rose-500/15 text-rose-300 ring-rose-500/25";
    case "warn":
      return "bg-amber-500/15 text-amber-200 ring-amber-500/25";
    case "info":
      return "bg-sky-500/15 text-sky-200 ring-sky-500/25";
    default:
      return "bg-zinc-700/80 text-zinc-400";
  }
}

export function AdminErrorsPanel() {
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(40);
  const [severity, setSeverity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState("");
  const [routeDraft, setRouteDraft] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState({
    sentry: false,
    betterStack: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (severity !== "all") qs.set("severity", severity);
      if (category !== "all") qs.set("category", category);
      if (routeFilter.trim()) qs.set("route", routeFilter.trim());
      if (fromDate) qs.set("from", fromDate);
      if (toDate) qs.set("to", toDate);

      const res = await fetch(`/api/admin/errors?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRows(data.errors as ErrorRow[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
      setIntegrations(
        (data.integrations as { sentry: boolean; betterStack: boolean }) ?? {
          sentry: false,
          betterStack: false,
        }
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, severity, category, routeFilter, fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setRouteFilter(routeDraft);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [routeDraft]);

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <Link
          href="/admin/system"
          className="mb-3 inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          System health
        </Link>
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          Error log
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Structured server-side logs — passwords and tokens are never stored.
          Forwarded to{" "}
          {integrations.sentry ? "Sentry" : "Sentry (not configured)"}
          {" · "}
          {integrations.betterStack
            ? "Better Stack"
            : "Better Stack (not configured)"}
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-500">Severity</Label>
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-500">Category</Label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px] space-y-1">
          <Label className="text-[10px] uppercase text-zinc-500">Route contains</Label>
          <Input
            value={routeDraft}
            onChange={(e) => setRouteDraft(e.target.value)}
            placeholder="/api/orders"
            className="h-10 border-zinc-700 bg-zinc-900 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-500">From</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="h-10 w-[140px] border-zinc-700 bg-zinc-900 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-zinc-500">To</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="h-10 w-[140px] border-zinc-700 bg-zinc-900 text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-4">
                        <Skeleton className="h-12 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <Fragment key={r.id}>
                      <tr
                        className="cursor-pointer hover:bg-zinc-800/40"
                        onClick={() =>
                          setExpanded(expanded === r.id ? null : r.id)
                        }
                      >
                        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset",
                              severityClass(r.severity)
                            )}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-zinc-300">
                          {r.category}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                          {r.route ?? "—"}
                        </td>
                        <td className="max-w-[280px] truncate px-4 py-3 text-zinc-200">
                          {r.message}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                          {r.userId ? `${r.userId.slice(0, 10)}…` : "—"}
                        </td>
                      </tr>
                      {expanded === r.id && r.stack ? (
                        <tr key={`${r.id}-stack`}>
                          <td colSpan={6} className="bg-zinc-950/80 px-4 py-3">
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-zinc-400">
                              {r.stack}
                            </pre>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={AlertTriangle}
            title="No errors in this window"
            description="Failures from auth, payments, bookings, and APIs appear here automatically."
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="errors"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </div>
  );
}
