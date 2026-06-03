import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryFilterParams } from "@/api/inventory/types";

export type InventoryFilterState = InventoryFilterParams & {
  stockStatus: string;
};

export const defaultInventoryFilters: InventoryFilterState = {
  search: "",
  brand: "",
  vehicle: "",
  stockStatus: "all",
  page: 1,
  limit: 25,
};

export function InventoryFilterBar({
  filters,
  onChange,
  onReset,
}: {
  filters: InventoryFilterState;
  onChange: (patch: Partial<InventoryFilterState>) => void;
  onReset: () => void;
}) {
  const active =
    filters.search ||
    filters.brand ||
    filters.vehicle ||
    filters.stockStatus !== "all";

  return (
    <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="h-4 w-4 text-stone-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          Inventory filters
        </span>
        {active && (
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={onReset}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="col-span-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Product, SKU, brand…"
            value={filters.search ?? ""}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
          />
        </div>
        <Input
          className="h-9 text-sm"
          placeholder="Brand"
          value={filters.brand ?? ""}
          onChange={(e) => onChange({ brand: e.target.value, page: 1 })}
        />
        <Input
          className="h-9 text-sm"
          placeholder="Vehicle fitment"
          value={filters.vehicle ?? ""}
          onChange={(e) => onChange({ vehicle: e.target.value, page: 1 })}
        />
        <Select
          value={filters.stockStatus}
          onValueChange={(v) => onChange({ stockStatus: v, page: 1 })}
        >
          <SelectTrigger className="h-9 text-sm col-span-2 md:col-span-1">
            <SelectValue placeholder="Stock status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="low_stock">Low stock</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="out_of_stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
