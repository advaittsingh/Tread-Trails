import { Badge } from "@/components/ui/badge";
import type { InventoryStockStatus } from "@/api/inventory/types";
import { cn } from "@/lib/utils";

const STYLES: Record<InventoryStockStatus, string> = {
  in_stock: "bg-emerald-50 text-emerald-900 border-emerald-200",
  low_stock: "bg-amber-50 text-amber-900 border-amber-200",
  critical: "bg-red-50 text-red-800 border-red-200",
  out_of_stock: "bg-red-950/10 text-red-950 border-red-300",
};

const LABELS: Record<InventoryStockStatus, string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  critical: "Critical",
  out_of_stock: "Out Of Stock",
};

export function StockStatusBadge({ status }: { status: InventoryStockStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium whitespace-nowrap", STYLES[status])}
    >
      {LABELS[status]}
    </Badge>
  );
}
