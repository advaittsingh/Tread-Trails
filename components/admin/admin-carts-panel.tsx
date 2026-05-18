"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

import { formatInr } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPaginationBar } from "@/components/admin/admin-pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type CartLine = {
  name: string;
  productSlug: string;
  quantity: number;
  unitPrice?: number | null;
  image?: string;
  variantLabel?: string;
};

type RecoveryMeta = {
  sentAt: string | null;
  whatsappAt: string | null;
  template: string | null;
  recovered: boolean;
  recoveredAt: string | null;
  converted: boolean;
  convertedAt: string | null;
  convertedOrderId: string | null;
};

type Row = {
  sessionId: string;
  itemCount: number;
  subtotalHint: number;
  userEmail: string | null;
  customerName: string | null;
  lastPath: string;
  updatedAt: string;
  lastActivityMinutes: number;
  lines: CartLine[];
  recovery: RecoveryMeta;
};

type ViewFilter = "all" | "recoverable" | "emailed" | "converted";
type TemplateId = "complete_order" | "cart_waiting";

async function recover(
  body: Record<string, unknown>
): Promise<{ ok?: boolean; error?: string; whatsappUrl?: string }> {
  const res = await fetch("/api/admin/carts/recover", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Recovery failed");
  return data;
}

function RecoveryBadge({ recovery }: { recovery: RecoveryMeta }) {
  if (recovery.converted) {
    return (
      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
        Converted
      </span>
    );
  }
  if (recovery.sentAt) {
    return (
      <span className="rounded-full bg-brand-maroon-light/15 px-2 py-0.5 text-[10px] font-medium text-brand-gold-dark">
        Emailed
      </span>
    );
  }
  if (recovery.whatsappAt) {
    return (
      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">
        WhatsApp
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-700/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
      Open
    </span>
  );
}

export function AdminCartsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [view, setView] = useState<ViewFilter>("recoverable");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateId>("complete_order");
  const [busySession, setBusySession] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) qs.set("search", search.trim());
      if (view !== "all") qs.set("view", view);
      const res = await fetch(`/api/admin/carts?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRows(data.carts as Row[]);
      setTotal(data.total as number);
      setTotalPages(data.totalPages as number);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      toastError("Could not load carts", msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, view]);

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

  const runRecover = async (
    sessionId: string,
    action: "email" | "whatsapp" | "mark_recovered" | "mark_converted",
    extra?: Record<string, unknown>
  ) => {
    setBusySession(sessionId);
    try {
      const data = await recover({
        sessionId,
        action,
        template,
        ...extra,
      });
      if (action === "whatsapp" && data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        toastSuccess("WhatsApp draft opened", "Log saved for this cart.");
      } else if (action === "email") {
        toastSuccess("Recovery email sent");
      } else if (action === "mark_recovered") {
        toastSuccess("Marked as recovered");
      } else {
        toastSuccess("Marked as converted");
      }
      await load();
    } catch (e) {
      toastError(
        "Recovery action failed",
        e instanceof Error ? e.message : "Unknown error"
      );
    } finally {
      setBusySession(null);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          Abandoned cart recovery
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Rich line items, recovery emails (Resend / SendGrid), WhatsApp nudges, and
          conversion tracking when orders complete.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <div className="max-w-md flex-1 space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Search
          </Label>
          <Input
            placeholder="Session, email, name, or path…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="w-44 space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            View
          </Label>
          <Select
            value={view}
            onValueChange={(v) => {
              setView(v as ViewFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="border-zinc-700 bg-zinc-900 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recoverable">Recoverable</SelectItem>
              <SelectItem value="all">All with items</SelectItem>
              <SelectItem value="emailed">Emailed</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-52 space-y-2">
          <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
            Email template
          </Label>
          <Select
            value={template}
            onValueChange={(v) => setTemplate(v as TemplateId)}
          >
            <SelectTrigger className="border-zinc-700 bg-zinc-900 text-zinc-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete_order">Complete your order</SelectItem>
              <SelectItem value="cart_waiting">Your cart is waiting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="border-zinc-700"
        >
          <RefreshCw className={cn("mr-1.5 size-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="w-8 px-2 py-3" />
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Recovery</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-4 py-4">
                        <Skeleton className="h-14 w-full rounded-lg bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                : rows.map((r) => {
                    const isOpen = expanded === r.sessionId;
                    const busy = busySession === r.sessionId;
                    return (
                      <Fragment key={r.sessionId}>
                        <tr className="hover:bg-zinc-800/40">
                          <td className="px-2 py-4">
                            <button
                              type="button"
                              aria-label={isOpen ? "Collapse" : "Expand"}
                              onClick={() =>
                                setExpanded(isOpen ? null : r.sessionId)
                              }
                              className="text-zinc-500 hover:text-zinc-200"
                            >
                              {isOpen ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-zinc-100">
                              {r.customerName ?? "Guest"}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {r.userEmail ?? "No email"}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                              {r.sessionId.slice(0, 18)}…
                            </p>
                          </td>
                          <td className="px-4 py-4 tabular-nums text-zinc-300">
                            {r.itemCount}
                          </td>
                          <td className="px-4 py-4 tabular-nums font-medium text-zinc-200">
                            {formatInr(r.subtotalHint) ?? "—"}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-amber-200/90">
                              {r.lastActivityMinutes} min ago
                            </p>
                            <p className="mt-0.5 max-w-[140px] truncate text-[10px] text-zinc-500">
                              {r.lastPath || "/"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <RecoveryBadge recovery={r.recovery} />
                            {r.recovery.sentAt ? (
                              <p className="mt-1 text-[10px] text-zinc-500">
                                Sent{" "}
                                {new Date(r.recovery.sentAt).toLocaleDateString()}
                              </p>
                            ) : null}
                            {r.recovery.convertedOrderId ? (
                              <Link
                                href={`/admin/orders/${r.recovery.convertedOrderId}`}
                                className="mt-1 block text-[10px] text-violet-400 hover:underline"
                              >
                                Order linked
                              </Link>
                            ) : null}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={!r.userEmail || busy || r.recovery.converted}
                                className="h-8 text-xs text-brand-gold-dark"
                                onClick={() => void runRecover(r.sessionId, "email")}
                              >
                                {busy ? (
                                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                                ) : (
                                  <Mail className="mr-1 size-3.5" />
                                )}
                                Email
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={busy || r.recovery.converted}
                                className="h-8 text-xs text-sky-400"
                                onClick={() =>
                                  void runRecover(r.sessionId, "whatsapp")
                                }
                              >
                                <MessageCircle className="mr-1 size-3.5" />
                                WhatsApp
                              </Button>
                              {!r.recovery.recovered ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  className="h-8 text-xs text-zinc-400"
                                  onClick={() =>
                                    void runRecover(r.sessionId, "mark_recovered")
                                  }
                                >
                                  <CheckCircle2 className="mr-1 size-3.5" />
                                  Recovered
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr>
                            <td colSpan={7} className="bg-zinc-950/60 px-6 py-4">
                              {r.lines.length === 0 ? (
                                <p className="text-xs text-zinc-500">No line detail.</p>
                              ) : (
                                <ul className="grid gap-3 sm:grid-cols-2">
                                  {r.lines.map((line) => (
                                    <li
                                      key={`${line.productSlug}-${line.variantLabel ?? ""}`}
                                      className="flex gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3"
                                    >
                                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                                        {line.image ? (
                                          <Image
                                            src={line.image}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="56px"
                                            unoptimized={
                                              line.image.startsWith("http")
                                            }
                                          />
                                        ) : (
                                          <div className="flex size-full items-center justify-center text-zinc-600">
                                            <ShoppingCart className="size-5" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1 text-xs">
                                        <p className="font-medium text-zinc-100">
                                          {line.name}
                                        </p>
                                        <p className="font-mono text-zinc-500">
                                          {line.productSlug}
                                        </p>
                                        {line.variantLabel ? (
                                          <p className="text-zinc-500">
                                            {line.variantLabel}
                                          </p>
                                        ) : null}
                                        <p className="mt-1 text-zinc-400">
                                          Qty {line.quantity}
                                          {line.unitPrice != null
                                            ? ` · ${formatInr(line.unitPrice * line.quantity)}`
                                            : ""}
                                        </p>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingCart}
            title={
              search.trim() || view !== "all"
                ? "No carts match filters"
                : "No abandoned carts with items"
            }
            description="Telemetry syncs every ~12s from the storefront cart."
          />
        ) : null}

        <AdminPaginationBar
          total={total}
          page={page}
          limit={limit}
          totalPages={totalPages}
          loading={loading}
          nounPlural="carts"
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </div>
  );
}
