"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox } from "lucide-react";

import { toastError } from "@/lib/toast";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Submission = {
  id: string;
  kind: "contact" | "corporate";
  payload: Record<string, unknown>;
  emailSent: boolean;
  readAt: string | null;
  createdAt: string;
};

export function AdminInboxPanel() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);
  const [kind, setKind] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (kind) qs.set("kind", kind);
      if (unreadOnly) qs.set("unread", "1");
      const res = await fetch(`/api/admin/inbox?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRows(data.submissions as Submission[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
    } catch (e) {
      toastError("Inbox", e instanceof Error ? e.message : "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, kind, unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string, read: boolean) {
    try {
      const res = await fetch(`/api/admin/inbox/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      if (!res.ok) throw new Error("Update failed");
      await load();
      if (selected?.id === id) {
        setSelected((s) =>
          s ? { ...s, readAt: read ? new Date().toISOString() : null } : s
        );
      }
    } catch (e) {
      toastError("Inbox", e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          Inbox
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Contact and corporate submissions stored when forms are submitted.
        </p>
      </header>

      <div className="flex flex-wrap gap-4">
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
        >
          <option value="">All types</option>
          <option value="contact">Contact</option>
          <option value="corporate">Corporate</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-zinc-600"
          />
          Unread only
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <div className="divide-y divide-zinc-800/80">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <Skeleton className="h-12 w-full bg-zinc-800" />
                  </div>
                ))
              : rows.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelected(r);
                      if (!r.readAt) void markRead(r.id, true);
                    }}
                    className={`w-full px-4 py-3 text-left transition hover:bg-zinc-800/50 ${
                      selected?.id === r.id ? "bg-zinc-800/60" : ""
                    } ${!r.readAt ? "border-l-2 border-emerald-500" : ""}`}
                  >
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      {r.kind}
                      {!r.readAt ? (
                        <span className="ml-2 text-emerald-400">new</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-100">
                      {previewSubject(r)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      {new Date(r.createdAt).toLocaleString()}
                      {r.emailSent ? " · emailed" : " · email pending"}
                    </p>
                  </button>
                ))}
          </div>
          {!loading && rows.length === 0 ? (
            <AdminEmptyState
              icon={Inbox}
              title="Inbox empty"
              description="Submissions appear after contact or corporate forms are used."
            />
          ) : null}
          <AdminPaginationBar
            total={total}
            page={page}
            limit={limit}
            totalPages={totalPages}
            loading={loading}
            nounPlural="messages"
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          {selected ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm font-medium capitalize text-zinc-200">
                  {selected.kind}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-zinc-400"
                  onClick={() => void markRead(selected.id, !selected.readAt)}
                >
                  {selected.readAt ? "Mark unread" : "Mark read"}
                </Button>
              </div>
              <pre className="max-h-[480px] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Select a message to read.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function previewSubject(r: Submission): string {
  const p = r.payload;
  if (r.kind === "contact") {
    return String(p.subject ?? p.email ?? "Contact");
  }
  return String(p.companyName ?? p.email ?? "Corporate");
}
