import { AlertTriangle, IndianRupee, Package } from "lucide-react";
import type { ProductsSummary } from "@/api/products/types";
import { formatInr } from "@/lib/format";

export function InventoryMonitor({ summary }: { summary?: ProductsSummary }) {
  if (!summary) return null;

  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <div className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
        <IndianRupee className="h-3.5 w-3.5 text-stone-600" />
        <span>
          Inventory value{" "}
          <strong className="text-stone-900 tabular-nums">
            {formatInr(summary.inventoryValue)}
          </strong>
        </span>
      </div>
      {summary.lowStock > 0 && (
        <div className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            <strong>{summary.lowStock}</strong> SKUs need reorder
          </span>
        </div>
      )}
      {summary.outOfStock > 0 && (
        <div className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
          <Package className="h-3.5 w-3.5" />
          <span>
            <strong>{summary.outOfStock}</strong> out of stock
          </span>
        </div>
      )}
    </div>
  );
}
