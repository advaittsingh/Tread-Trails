import { useMemo, useState } from "react";
import { useAdminQuery } from "@/api/admin";
import { apiFetch, buildApiPath } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
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

type RankedRow = {
  key: string;
  label: string;
  count: number;
  revenue?: number;
};

type AnalyticsReport = {
  range: { from: string; to: string; label: string; dayCount: number };
  totals: {
    pageViews: number;
    uniqueSessions: number;
    orders: number;
    paidOrders: number;
    revenuePaid: number;
    bookings: number;
    cartSessions: number;
    conversionPercent: number;
  };
  funnel: {
    visits: number;
    carts: number;
    purchases: number;
    cartRate: number;
    purchaseRate: number;
  };
  series: {
    revenueByDay: Array<{ date: string; revenue: number }>;
    ordersByDay: Array<{ date: string; count: number }>;
    bookingsByDay: Array<{ date: string; count: number }>;
    visitsByDay: Array<{ date: string; views: number; sessions: number }>;
  };
  topProducts: RankedRow[];
  topBrands: RankedRow[];
  topVehicles: RankedRow[];
  bookings: {
    byStatus: RankedRow[];
    byService: RankedRow[];
  };
};

const DAY_PRESETS = [7, 30, 90, 180, 365];

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function downloadExport(
  format: "csv" | "xlsx" | "pdf",
  params: Record<string, string>
) {
  const path = buildApiPath("/api/admin/analytics/export", { ...params, format });
  const res = await apiFetch(path);
  if (!res.ok) {
    const text = await res.text();
    let msg = `Export failed (${res.status})`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) msg = json.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `analytics.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-xl font-semibold text-stone-900 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function RankedTable({
  rows,
  countLabel,
  showRevenue,
}: {
  rows: RankedRow[];
  countLabel: string;
  showRevenue?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">No data in this period.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">{countLabel}</TableHead>
          {showRevenue ? <TableHead className="text-right">Revenue</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>{row.label}</TableCell>
            <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
            {showRevenue ? (
              <TableCell className="text-right">{formatInr(row.revenue ?? 0)}</TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [days, setDays] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    if (useCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return { days };
  }, [useCustom, customFrom, customTo, days]);

  const q = useAdminQuery<AnalyticsReport>("/api/admin/analytics", queryParams);

  const revenueChart = useMemo(
    () =>
      (q.data?.series.revenueByDay ?? []).map((d) => ({
        date: shortDate(d.date),
        revenue: d.revenue,
      })),
    [q.data]
  );

  const bookingChart = useMemo(
    () =>
      (q.data?.series.bookingsByDay ?? []).map((d) => ({
        date: shortDate(d.date),
        bookings: d.count,
      })),
    [q.data]
  );

  const productChart = useMemo(
    () =>
      (q.data?.topProducts ?? []).slice(0, 8).map((p) => ({
        name: p.label.length > 18 ? `${p.label.slice(0, 16)}…` : p.label,
        revenue: p.revenue ?? 0,
      })),
    [q.data]
  );

  const brandChart = useMemo(
    () =>
      (q.data?.topBrands ?? []).slice(0, 8).map((b) => ({
        name: b.label,
        revenue: b.revenue ?? 0,
      })),
    [q.data]
  );

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    setExporting(format);
    try {
      const exportParams: Record<string, string> = useCustom && customFrom && customTo
        ? { from: customFrom, to: customTo }
        : { days };
      await downloadExport(format, exportParams);
      toast({ title: `${format.toUpperCase()} export downloaded` });
    } catch (e) {
      toast({
        title: "Export failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const report = q.data;

  return (
    <div className="px-3 lg:px-6 pb-6 space-y-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label>Range</Label>
            <Select
              value={useCustom ? "custom" : days}
              onValueChange={(v) => {
                if (v === "custom") setUseCustom(true);
                else {
                  setUseCustom(false);
                  setDays(v);
                }
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_PRESETS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Last {d} days
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {useCustom ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!!exporting}
            onClick={() => void handleExport("csv")}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!!exporting}
            onClick={() => void handleExport("xlsx")}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!!exporting}
            onClick={() => void handleExport("pdf")}
          >
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-stone-600">Loading analytics…</p>
      ) : q.error ? (
        <p className="text-sm text-red-700">{(q.error as Error).message}</p>
      ) : report ? (
        <>
          <p className="text-sm text-stone-500">{report.range.label}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue (paid)" value={formatInr(report.totals.revenuePaid)} />
            <StatCard label="Paid orders" value={String(report.totals.paidOrders)} />
            <StatCard label="Bookings" value={String(report.totals.bookings)} />
            <StatCard
              label="Conversion"
              value={`${report.totals.conversionPercent}%`}
            />
          </div>

          <Tabs defaultValue="revenue">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue trends</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v: number) => formatInr(v)} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#292524"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-3 text-sm">
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-stone-500">Funnel — visits</p>
                    <p className="text-lg font-semibold">{report.funnel.visits.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-stone-500">Cart rate</p>
                    <p className="text-lg font-semibold">{report.funnel.cartRate}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <p className="text-stone-500">Purchase rate (cart → paid)</p>
                    <p className="text-lg font-semibold">{report.funnel.purchaseRate}%</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Product performance</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productChart} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => formatInr(v)} />
                      <Bar dataKey="revenue" fill="#78716c" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <RankedTable
                    rows={report.topProducts}
                    countLabel="Units"
                    showRevenue
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="brands" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Brand performance</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatInr(v)} />
                      <Bar dataKey="revenue" fill="#57534e" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <RankedTable rows={report.topBrands} countLabel="Units" showRevenue />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bookings over time</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bookingChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#44403c"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <RankedTable rows={report.bookings.byStatus} countLabel="Count" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By service</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <RankedTable rows={report.bookings.byService} countLabel="Count" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top vehicles booked</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <RankedTable rows={report.topVehicles} countLabel="Bookings" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
