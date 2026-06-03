import {
  IndianRupee,
  Package,
  ShoppingBag,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardKpis } from "@/api/dashboard/types";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

const KPI_CONFIG = [
  {
    key: "revenueToday" as const,
    label: "Revenue Today",
    icon: IndianRupee,
    format: (v: number) => formatInr(v),
    accent: "from-stone-900 to-stone-800",
  },
  {
    key: "revenueThisMonth" as const,
    label: "Revenue This Month",
    icon: TrendingUp,
    format: (v: number) => formatInr(v, { compact: true }),
    accent: "from-stone-800 to-stone-700",
  },
  {
    key: "ordersToday" as const,
    label: "Orders Today",
    icon: ShoppingBag,
    format: (v: number) => String(v),
    accent: "from-amber-700 to-amber-800",
  },
  {
    key: "pendingOrders" as const,
    label: "Pending Orders",
    icon: Timer,
    format: (v: number) => String(v),
    accent: "from-orange-700 to-orange-800",
  },
  {
    key: "inventoryValue" as const,
    label: "Inventory Value",
    icon: Package,
    format: (v: number) => formatInr(v, { compact: true }),
    accent: "from-stone-700 to-stone-600",
  },
  {
    key: "newLeads" as const,
    label: "New Leads",
    icon: Users,
    format: (v: number) => String(v),
    accent: "from-emerald-800 to-emerald-900",
  },
];

export function KpiStrip({
  kpis,
  isLoading,
}: {
  kpis?: DashboardKpis;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {KPI_CONFIG.map((cfg) => {
        const Icon = cfg.icon;
        const value = kpis?.[cfg.key];
        return (
          <Card
            key={cfg.key}
            className="border-stone-200 shadow-none overflow-hidden"
          >
            <CardContent className="p-0">
              <div
                className={cn(
                  "h-1 bg-gradient-to-r",
                  cfg.accent
                )}
              />
              <div className="p-3.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500 leading-tight">
                    {cfg.label}
                  </span>
                  <div className="h-7 w-7 rounded-md bg-stone-100 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-stone-700" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-lg font-semibold text-stone-900 tabular-nums tracking-tight">
                    {value != null ? cfg.format(value) : "—"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
