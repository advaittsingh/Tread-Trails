import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardAnalytics } from "@/api/dashboard/types";
import { formatChartDate, formatInr } from "@/lib/format";

export function RevenueAnalytics({
  analytics,
  isLoading,
}: {
  analytics?: DashboardAnalytics;
  isLoading?: boolean;
}) {
  const revenueData =
    analytics?.revenueByDay.map((d) => ({
      date: formatChartDate(d.date),
      revenue: d.revenue,
    })) ?? [];

  const ordersData =
    analytics?.ordersByDay.map((d) => ({
      date: formatChartDate(d.date),
      orders: d.count,
    })) ?? [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">
      <Card className="xl:col-span-5 border-stone-200 shadow-none">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-stone-900">
            Revenue · {analytics?.rangeLabel ?? "Last 30 days"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#78716c" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#78716c" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 100_000 ? `₹${(v / 100_000).toFixed(0)}L` : `₹${v}`
                  }
                  width={48}
                />
                <Tooltip
                  formatter={(value: number) => [formatInr(value), "Revenue"]}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e7e5e4",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1c1917"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#1c1917" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-4 border-stone-200 shadow-none">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-stone-900">
            Orders trend
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#78716c" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#78716c" }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [value, "Orders"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e7e5e4",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="orders" fill="#57534e" radius={[2, 2, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-3 border-stone-200 shadow-none bg-stone-900 text-white">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-stone-100">
            Average order value
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {isLoading ? (
            <Skeleton className="h-12 w-full bg-stone-700" />
          ) : (
            <>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {formatInr(analytics?.averageOrderValue ?? 0)}
              </p>
              <div className="space-y-2 pt-2 border-t border-stone-700 text-sm">
                <div className="flex justify-between text-stone-300">
                  <span>30d revenue</span>
                  <span className="font-medium text-white tabular-nums">
                    {formatInr(analytics?.revenuePaid30d ?? 0, { compact: true })}
                  </span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>30d orders</span>
                  <span className="font-medium text-white tabular-nums">
                    {analytics?.orders30d ?? 0}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
