import {
  AlertTriangle,
  Box,
  FileBox,
  Link2Off,
  Package,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductsSummary } from "@/api/products/types";
import { formatInr } from "@/lib/format";

const KPIS = [
  { key: "totalProducts" as const, label: "Total Products", icon: Package },
  { key: "activeProducts" as const, label: "Active", icon: PackageCheck },
  { key: "draftProducts" as const, label: "Draft", icon: FileBox },
  { key: "outOfStock" as const, label: "Out of Stock", icon: Box },
  { key: "lowStock" as const, label: "Low Stock", icon: AlertTriangle },
  { key: "missingCompatibility" as const, label: "Missing Fitment", icon: Link2Off },
];

export function ProductsKpiStrip({
  summary,
  isLoading,
}: {
  summary?: ProductsSummary;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {KPIS.map((cfg) => {
        const Icon = cfg.icon;
        const value = summary?.[cfg.key];
        return (
          <Card key={cfg.key} className="border-stone-200 shadow-none">
            <CardContent className="p-3.5">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                  {cfg.label}
                </span>
                <Icon className="h-3.5 w-3.5 text-stone-500" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <p className="text-lg font-semibold text-stone-900 tabular-nums">
                  {value ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
      {summary && !isLoading && (
        <div className="col-span-2 md:col-span-3 xl:col-span-6 flex flex-wrap gap-4 text-xs text-stone-600 pt-1">
          <span>
            Inventory value:{" "}
            <strong className="text-stone-900">
              {formatInr(summary.inventoryValue, { compact: true })}
            </strong>
          </span>
          <span>
            Fitment coverage:{" "}
            <strong className="text-stone-900">
              {summary.compatibilityCoveragePercent}%
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
