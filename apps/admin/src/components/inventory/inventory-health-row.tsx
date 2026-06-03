import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventorySummary } from "@/api/inventory/types";

export function InventoryHealthRow({
  summary,
  isLoading,
}: {
  summary?: InventorySummary;
  isLoading?: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3 mt-3">
      <Card className="border-stone-200 shadow-none">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">
            Inventory Health
          </p>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="flex items-end justify-between mb-2">
                <p className="text-2xl font-semibold text-stone-900 tabular-nums">
                  Healthy: {summary?.healthPercent ?? 0}%
                </p>
                <div className="text-right text-xs text-stone-600 space-y-0.5">
                  <p>Low Stock: {summary?.lowStock ?? 0}</p>
                  <p>Critical: {summary?.criticalCount ?? 0}</p>
                </div>
              </div>
              <Progress value={summary?.healthPercent ?? 0} className="h-2" />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-none">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">
            Warehouse Summary
          </p>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(summary?.warehouseSummary ?? []).map((w) => (
                <div key={w.warehouseId} className="min-w-0">
                  <p className="text-xs font-medium text-stone-900 truncate">
                    {w.warehouseName.replace(" Warehouse", "")}
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-stone-900">
                    {w.skuCount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-stone-500">SKUs · {w.units} units</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
