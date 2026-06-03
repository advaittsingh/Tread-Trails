import { Badge } from "@/components/ui/badge";
import type { ProductStockStatus } from "@/api/products/types";
import { cn } from "@/lib/utils";

const STYLES: Record<ProductStockStatus, string> = {
  in_stock: "bg-emerald-50 text-emerald-900 border-emerald-200",
  low_stock: "bg-amber-50 text-amber-900 border-amber-200",
  out_of_stock: "bg-red-50 text-red-800 border-red-200",
  no_inventory: "bg-stone-100 text-stone-600 border-stone-200",
};

const LABELS: Record<ProductStockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  no_inventory: "No inventory",
};

export function StockIndicator({ status }: { status: ProductStockStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium capitalize", STYLES[status])}
    >
      {LABELS[status]}
    </Badge>
  );
}
