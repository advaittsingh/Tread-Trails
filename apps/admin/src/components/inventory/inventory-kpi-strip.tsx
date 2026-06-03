import {
  AlertTriangle,
  Boxes,
  PackageX,
  ShoppingCart,
  Truck,
  Warehouse,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventorySummary } from "@/api/inventory/types";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatCompactInr(amount: number) {
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  return formatInr(amount);
}

const KPIS = [
  { key: "totalSkus" as const, label: "Total SKUs", icon: Boxes, format: (v: number) => v.toLocaleString("en-IN") },
  { key: "inventoryValue" as const, label: "Inventory Value", icon: ShoppingCart, format: formatCompactInr },
  { key: "lowStock" as const, label: "Low Stock", icon: AlertTriangle, format: (v: number) => String(v) },
  { key: "outOfStock" as const, label: "Out Of Stock", icon: PackageX, format: (v: number) => String(v) },
  { key: "incomingStock" as const, label: "Incoming Stock", icon: Truck, format: (v: number) => v.toLocaleString("en-IN") },
  { key: "reorderRequired" as const, label: "Reorder Required", icon: Warehouse, format: (v: number) => String(v) },
];

export function InventoryKpiStrip({
  summary,
  isLoading,
}: {
  summary?: InventorySummary;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {KPIS.map((cfg) => {
        const Icon = cfg.icon;
        const value = summary?.[cfg.key];
        const warn =
          cfg.key === "lowStock" ||
          cfg.key === "outOfStock" ||
          cfg.key === "reorderRequired";
        return (
          <Card key={cfg.key} className="border-stone-200 shadow-none overflow-hidden">
            <div
              className={cn(
                "h-0.5",
                warn && value && value > 0 ? "bg-amber-500" : "bg-stone-900"
              )}
            />
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
                <p
                  className={cn(
                    "font-semibold text-stone-900 tabular-nums",
                    cfg.key === "inventoryValue" ? "text-base" : "text-lg"
                  )}
                >
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
