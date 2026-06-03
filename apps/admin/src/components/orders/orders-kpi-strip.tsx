import {
  IndianRupee,
  Package,
  RotateCcw,
  ShoppingBag,
  Timer,
  Truck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrdersSummary } from "@/api/orders/types";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

const KPIS = [
  { key: "ordersToday" as const, label: "Orders Today", icon: ShoppingBag, format: (v: number) => String(v) },
  { key: "pendingOrders" as const, label: "Pending Orders", icon: Timer, format: (v: number) => String(v) },
  { key: "processingOrders" as const, label: "Processing", icon: Package, format: (v: number) => String(v) },
  { key: "shippedOrders" as const, label: "Shipped", icon: Truck, format: (v: number) => String(v) },
  { key: "returnedOrders" as const, label: "Returned / Cancelled", icon: RotateCcw, format: (v: number) => String(v) },
  { key: "revenueToday" as const, label: "Revenue Today", icon: IndianRupee, format: (v: number) => formatInr(v) },
];

export function OrdersKpiStrip({
  summary,
  isLoading,
}: {
  summary?: OrdersSummary;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {KPIS.map((cfg) => {
        const Icon = cfg.icon;
        const value = summary?.[cfg.key];
        return (
          <Card key={cfg.key} className="border-stone-200 shadow-none overflow-hidden">
            <div className="h-0.5 bg-stone-900" />
            <CardContent className="p-3.5">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 leading-tight">
                  {cfg.label}
                </span>
                <Icon className="h-3.5 w-3.5 text-stone-500 shrink-0" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className={cn("font-semibold text-stone-900 tabular-nums", cfg.key === "revenueToday" ? "text-base" : "text-lg")}>
                  {value != null ? cfg.format(value) : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
