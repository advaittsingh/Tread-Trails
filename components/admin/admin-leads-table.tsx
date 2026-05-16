"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";

import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "new" | "contacted" | "qualified" | "converted" | "closed";
type SourceFilter = "all" | "contact" | "corporate";
type PriorityFilter = "all" | "low" | "normal" | "high" | "urgent";

type Row = {
  id: string;
  source: string;
  status: string;
  priority: string;
  displayName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  companyName: string | null;
  assignedToName: string | null;
  createdAt: string;
};

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "converted", label: "Converted" },
  { id: "closed", label: "Closed" },
];

export function AdminLeadsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [status, setStatus] = useState<StatusFilter>("new");
  const [source, setSource] = useState<SourceFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [unassigned, setUnassigned] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) qs.set("search", search.trim());
      if (status !== "all") qs.set("status", status);
      if (source !== "all") qs.set("source", source);
      if (priority !== "all") qs.set("priority", priority);
      if (unassigned) qs.set("unassigned", "1");

      const res = await fetch(`/api/admin/leads?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRows(data.leads as Row[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      toastError("Could not load leads", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, source, priority, unassigned]);

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

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          Lead pipeline
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Contact and corporate inquiries with assignment, priority, outbound email,
          and full audit trail.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatus(tab.id);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              status === tab.id
                ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/30"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Search
          </Label>
          <Input
            placeholder="Name, email, company, subject…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Source
          </Label>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as SourceFilter);
              setPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
          >
            <option value="all">All sources</option>
            <option value="contact">Contact</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Priority
          </Label>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as PriorityFilter);
              setPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
          >
            <option value="all">All</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={unassigned}
            onChange={(e) => {
              setUnassigned(e.target.checked);
              setPage(1);
            }}
            className="rounded border-zinc-600"
          />
          Unassigned only
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-4">
                        <Skeleton className="h-12 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-4">
                        <p className="font-medium text-zinc-100">{r.displayName}</p>
                        <p className="text-xs text-zinc-400">{r.email}</p>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                          {r.subject ?? r.companyName ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4 capitalize text-zinc-300">
                        {r.source}
                      </td>
                      <td className="px-4 py-4">
                        <AdminStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-4">
                        <AdminStatusBadge status={r.priority} />
                      </td>
                      <td className="px-4 py-4 text-zinc-400">
                        {r.assignedToName ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-zinc-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/admin/leads/${r.id}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                            className: "text-emerald-400",
                          })}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={UserPlus}
            title="No leads match filters"
            description="New contact and corporate form submissions appear here automatically."
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="leads"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </div>
  );
}
