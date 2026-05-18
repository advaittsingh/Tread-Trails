"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Loader2 } from "lucide-react";

import type { AnalyticsReport } from "@/lib/analytics/types";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const PRESETS = [7, 30, 90, 180] as const;

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoYmd(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

const tooltipStyle = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 12,
  color: "#f4f4f5",
  fontSize: 12,
};

export function AdminAnalyticsDashboard() {
  const [presetDays, setPresetDays] = useState<number | null>(30);
  const [fromDate, setFromDate] = useState(daysAgoYmd(30));
  const [toDate, setToDate] = useState(todayYmd());
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (presetDays != null) {
      qs.set("days", String(presetDays));
    } else {
      qs.set("from", fromDate);
      qs.set("to", toDate);
    }
    return qs.toString();
  }, [presetDays, fromDate, toDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?${queryString}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load analytics");
      setData(json as AnalyticsReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?${queryString}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "analytics.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const funnelData = useMemo(() => {
    if (!data) return [];
    return [
      { stage: "Sessions", value: data.funnel.visits, pct: 100 },
      {
        stage: "Carts",
        value: data.funnel.carts,
        pct: data.funnel.cartRate,
      },
      {
        stage: "Paid",
        value: data.funnel.purchases,
        pct: data.funnel.purchaseRate,
      },
    ];
  }, [data]);

  const conversionChart = useMemo(() => {
    if (!data) return [];
    return data.series.conversionByDay.map((d) => ({
      ...d,
      label: formatShortDate(d.date),
    }));
  }, [data]);

  return (
    <div className="space-y-10 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.35em] text-brand-gold-dark uppercase">
              Business intelligence
            </p>
            <h1 className="mt-2 font-heading text-2xl tracking-tight text-white md:text-3xl">
              Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Server-side SQL aggregations — no full-table loads. Custom ranges up
              to 366 days.
            </p>
            {data ? (
              <p className="mt-1 text-xs text-zinc-500">{data.range.label}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || exporting || !data}
            className="border-zinc-700"
            onClick={() => void handleExport()}
          >
            {exporting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            Export CSV
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          {PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setPresetDays(d);
                setFromDate(daysAgoYmd(d));
                setToDate(todayYmd());
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                presetDays === d
                  ? "bg-brand-maroon-light/20 text-brand-gold ring-1 ring-brand-maroon-light/30"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {d}d
            </button>
          ))}
          <div className="flex flex-wrap items-end gap-2 border-l border-zinc-800 pl-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-zinc-500 uppercase">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPresetDays(null);
                }}
                className="h-9 w-[140px] border-zinc-700 bg-zinc-900 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-zinc-500 uppercase">To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPresetDays(null);
                }}
                className="h-9 w-[140px] border-zinc-700 bg-zinc-900 text-sm"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9"
              onClick={() => {
                setPresetDays(null);
                void load();
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {loading || !data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-zinc-900" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Revenue (paid)" value={formatInr(data.totals.revenuePaid) ?? "₹0"} accent />
            <MiniStat label="Paid orders" value={data.totals.paidOrders} />
            <MiniStat label="Unique sessions" value={data.totals.uniqueSessions} />
            <MiniStat
              label="Conversion"
              value={`${data.totals.conversionPercent}%`}
              hint="Paid / sessions"
            />
            <MiniStat label="Page views" value={data.totals.pageViews} />
            <MiniStat label="All orders" value={data.totals.orders} />
            <MiniStat label="Bookings" value={data.totals.bookings} />
            <MiniStat
              label="Abandoned carts"
              value={data.totals.abandonedStaleSessions}
              hint="30m+ idle in range"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Revenue trend (paid)">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.series.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="#71717a"
                    fontSize={10}
                    minTickGap={24}
                  />
                  <YAxis stroke="#71717a" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => formatShortDate(String(l))}
                    formatter={(value) => formatInr(Number(value)) ?? value}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#8f3a2c"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Conversion rate trend">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={conversionChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={10} minTickGap={20} />
                  <YAxis
                    yAxisId="left"
                    stroke="#71717a"
                    fontSize={10}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#a78bfa"
                    fontSize={10}
                    unit="%"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="sessions"
                    name="Sessions"
                    fill="#38bdf8"
                    opacity={0.35}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversionRate"
                    name="Conversion %"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Orders per day">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.series.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="#71717a"
                    fontSize={10}
                    minTickGap={24}
                  />
                  <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => formatShortDate(String(l))}
                  />
                  <Bar dataKey="count" name="Orders" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Bookings per day">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.series.bookingsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="#71717a"
                    fontSize={10}
                    minTickGap={24}
                  />
                  <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => formatShortDate(String(l))}
                  />
                  <Bar dataKey="count" name="Bookings" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Traffic · views & sessions">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.series.visitsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="#71717a"
                    fontSize={10}
                    minTickGap={24}
                  />
                  <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(l) => formatShortDate(String(l))}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name="Page views"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="#8f3a2c"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Funnel · sessions → carts → paid">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="stage" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, item) => {
                      const payload = item?.payload as { pct?: number };
                      return [
                        `${value} (${payload?.pct ?? 0}% of prior)`,
                        "Count",
                      ];
                    }}
                  />
                  <Bar dataKey="value" fill="#f0d050" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            <RankList
              title="Top products (paid revenue)"
              rows={data.topProducts.map((p) => ({
                key: p.key,
                primary: p.label,
                secondary: formatInr(p.revenue ?? 0) ?? "—",
                metric: `${p.count} units`,
              }))}
            />
            <RankList
              title="Top cart products"
              rows={data.topCartProducts.map((p) => ({
                key: p.key,
                primary: p.label,
                metric: String(p.count),
              }))}
            />
            <RankList
              title="Top vehicles (bookings)"
              rows={data.topVehicles.map((v) => ({
                key: v.key,
                primary: v.label,
                metric: String(v.count),
              }))}
            />
            <RankList
              title="Top pages"
              rows={data.topPages.map((p) => ({
                key: p.path,
                primary: p.path,
                metric: String(p.views),
                mono: true,
              }))}
            />
          </section>
        </>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        accent
          ? "border-brand-maroon-light/25 bg-brand-maroon-light/10"
          : "border-zinc-800 bg-zinc-900/40"
      )}
    >
      <p className="text-[11px] tracking-[0.15em] text-zinc-500 uppercase">{label}</p>
      <p className="mt-2 font-heading text-2xl tracking-tight text-white tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      {hint ? <p className="mt-1 text-[10px] text-zinc-600">{hint}</p> : null}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
      <p className="mb-3 text-sm font-medium text-zinc-200">{title}</p>
      <div className="min-h-[260px] w-full">{children}</div>
    </div>
  );
}

function RankList({
  title,
  rows,
}: {
  title: string;
  rows: {
    key: string;
    primary: string;
    secondary?: string;
    metric: string;
    mono?: boolean;
  }[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
      <p className="mb-4 text-sm font-medium text-zinc-200">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No data in this range.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
          {rows.map((r) => (
            <li key={r.key} className="flex justify-between gap-3 text-zinc-300">
              <span className={cn("min-w-0 truncate", r.mono && "font-mono text-xs")}>
                {r.primary}
                {r.secondary ? (
                  <span className="mt-0.5 block text-xs text-brand-gold-dark/90">
                    {r.secondary}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-zinc-500">{r.metric}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
