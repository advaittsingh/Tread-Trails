"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatInr } from "@/lib/format";

import { Skeleton } from "@/components/ui/skeleton";

type AnalyticsPayload = {
  totals: {
    pageViews: number;
    uniqueSessions: number;
    paidOrders: number;
    revenuePaid: number;
    bookings: number;
    cartSessions: number;
    abandonedStaleSessions: number;
    conversionPercentApprox: number;
  };
  funnel: { visits: number; carts: number; purchases: number };
  series: {
    revenueByDay: { date: string; revenue: number }[];
    ordersByDay: { date: string; count: number }[];
    bookingsByDay: { date: string; count: number }[];
    visitsByDay: { date: string; views: number }[];
  };
};

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics", {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        if (!cancelled) setData(json as AnalyticsPayload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const funnelData = data
    ? [
        { stage: "Sessions", value: data.funnel.visits },
        { stage: "Carts", value: data.funnel.carts },
        { stage: "Paid", value: data.funnel.purchases },
      ]
    : [];

  return (
    <div className="space-y-10 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <p className="text-[11px] font-medium tracking-[0.35em] text-emerald-400 uppercase">
          Phase 2 · Analytics
        </p>
        <h1 className="mt-2 font-heading text-2xl tracking-tight text-white md:text-3xl">
          Revenue & behaviour
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Rolling 30-day window sourced from Mongo telemetry + transactional collections.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {!data ? (
        <div className="grid gap-5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-zinc-900" />
          ))}
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-4">
          <MiniStat label="Page views" value={data.totals.pageViews} />
          <MiniStat label="Unique sessions" value={data.totals.uniqueSessions} />
          <MiniStat
            label="Conversion (approx)"
            value={`${data.totals.conversionPercentApprox}%`}
          />
          <MiniStat
            label="Abandoned (30m+ idle)"
            value={data.totals.abandonedStaleSessions}
          />
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <ChartCard title="Revenue (paid orders)">
          {data ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.series.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 12,
                    color: "#f4f4f5",
                  }}
                  formatter={(value) => {
                    const n =
                      typeof value === "number"
                        ? value
                        : Number(value);
                    const safe = Number.isFinite(n) ? n : 0;
                    return formatInr(safe) ?? `₹${safe}`;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[260px] w-full rounded-xl bg-zinc-900" />
          )}
        </ChartCard>

        <ChartCard title="Traffic (page hits)">
          {data ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.series.visitsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 12,
                    color: "#f4f4f5",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[260px] w-full rounded-xl bg-zinc-900" />
          )}
        </ChartCard>

        <ChartCard title="Orders per day">
          {data ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.series.ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 12,
                    color: "#f4f4f5",
                  }}
                />
                <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[260px] w-full rounded-xl bg-zinc-900" />
          )}
        </ChartCard>

        <ChartCard title="Funnel · sessions → carts → paid">
          {data ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="stage" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: 12,
                    color: "#f4f4f5",
                  }}
                />
                <Bar dataKey="value" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[260px] w-full rounded-xl bg-zinc-900" />
          )}
        </ChartCard>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <p className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase">
        {label}
      </p>
      <p className="mt-3 font-heading text-2xl tracking-tight text-white tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
      <p className="mb-4 text-sm font-medium text-zinc-200">{title}</p>
      {children}
    </div>
  );
}
