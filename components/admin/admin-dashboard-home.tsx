"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, Layers, Package } from "lucide-react";

import { formatInr } from "@/lib/format";

import { Skeleton } from "@/components/ui/skeleton";

type Stats = {
  totalOrders: number;
  paidOrderCount: number;
  totalRevenuePaid: number;
  totalBookings: number;
};

export function AdminDashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load stats");
        if (!cancelled) setStats(data as Stats);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10 p-6 lg:p-10">
      <header className="space-y-2 border-b border-zinc-800 pb-8">
        <p className="text-[11px] font-medium tracking-[0.35em] text-brand-gold-dark uppercase">
          Phase 1 · Operations
        </p>
        <h1 className="font-heading text-3xl tracking-tight text-white md:text-4xl">
          Studio dashboard
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Live fulfilment radar — Stripe-paid revenue, bay requests, and order intake from Neon (Postgres).
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <section className="grid gap-5 md:grid-cols-3">
        <MetricCard
          title="Total orders"
          value={stats ? stats.totalOrders.toLocaleString("en-IN") : null}
          hint="All channels · COD + Stripe"
          icon={<Package className="size-5" />}
        />
        <MetricCard
          title="Paid revenue"
          value={
            stats ? formatInr(stats.totalRevenuePaid) ?? "₹0" : null
          }
          hint={`${stats?.paidOrderCount ?? "—"} settled checkouts`}
          accent
          icon={<span className="text-lg font-semibold tabular-nums">₹</span>}
        />
        <MetricCard
          title="Bookings"
          value={stats ? stats.totalBookings.toLocaleString("en-IN") : null}
          hint="Installation requests"
          icon={<CalendarClock className="size-5" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/admin/orders"
          className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-5 transition hover:border-brand-maroon-light/35 hover:bg-zinc-900/70"
        >
          <div>
            <p className="text-sm font-medium text-white">Manage orders</p>
            <p className="mt-1 text-xs text-zinc-500">
              Pagination, status filters, fulfilment updates
            </p>
          </div>
          <ArrowRight className="size-5 text-zinc-600 transition group-hover:text-brand-gold-dark" />
        </Link>
        <Link
          href="/admin/products"
          className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-5 transition hover:border-brand-maroon-light/35 hover:bg-zinc-900/70"
        >
          <div>
            <p className="text-sm font-medium text-white">Catalog · products</p>
            <p className="mt-1 text-xs text-zinc-500">
              CRUD, vehicle compatibility, Neon-backed SKUs
            </p>
          </div>
          <Layers className="size-5 text-zinc-600 transition group-hover:text-brand-gold-dark" />
        </Link>
        <Link
          href="/admin/bookings"
          className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-5 transition hover:border-brand-maroon-light/35 hover:bg-zinc-900/70"
        >
          <div>
            <p className="text-sm font-medium text-white">Manage bookings</p>
            <p className="mt-1 text-xs text-zinc-500">
              Customer bay calendar signals
            </p>
          </div>
          <ArrowRight className="size-5 text-zinc-600 transition group-hover:text-brand-gold-dark" />
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 px-6 py-8">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
          Phase 2 preview
        </p>
        <p className="mt-3 max-w-xl text-sm text-zinc-400">
          Analytics, live presence, abandoned carts, CRM sends, and system health are wired under{" "}
          <span className="text-zinc-200">Intelligence</span> in the sidebar — telemetry begins as soon as shoppers browse the storefront.
        </p>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon,
  accent,
}: {
  title: string;
  value: string | null;
  hint: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/35 p-6 shadow-inner ${
        accent ? "ring-1 ring-brand-maroon-light/15" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
            {title}
          </p>
          <div className="mt-3">
            {value === null ? (
              <Skeleton className="h-9 w-28 rounded-md bg-zinc-800" />
            ) : (
              <p className="font-heading text-3xl tracking-tight text-white tabular-nums">
                {value}
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">{hint}</p>
        </div>
        <div
          className={`rounded-xl border border-zinc-700/80 p-2.5 text-zinc-400 ${
            accent ? "border-brand-maroon-light/30 text-brand-gold-dark" : ""
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
