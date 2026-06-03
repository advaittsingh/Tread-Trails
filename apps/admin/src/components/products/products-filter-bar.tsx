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
import type { ProductsFilterParams } from "@/api/products/types";

export type ProductsFilterState = ProductsFilterParams & {
  stockStatus: string;
  publicationStatus: string;
};

export const defaultProductFilters: ProductsFilterState = {
  search: "",
  sku: "",
  brand: "",
  category: "",
  vehicle: "",
  stockStatus: "all",
  publicationStatus: "all",
  page: 1,
  limit: 25,
};

export function ProductsFilterBar({
  filters,
  onChange,
  onReset,
}: {
  filters: ProductsFilterState;
  onChange: (patch: Partial<ProductsFilterState>) => void;
  onReset: () => void;
}) {
  const active =
    filters.search ||
    filters.sku ||
    filters.brand ||
    filters.category ||
    filters.vehicle ||
    filters.stockStatus !== "all" ||
    filters.publicationStatus !== "all";

  return (
    <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="h-4 w-4 text-stone-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          Product filters
        </span>
        {active && (
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={onReset}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
        <div className="col-span-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Product name"
            value={filters.search ?? ""}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
          />
        </div>
        <Input
          className="h-9 text-sm"
          placeholder="SKU"
          value={filters.sku ?? ""}
          onChange={(e) => onChange({ sku: e.target.value, page: 1 })}
        />
        <Input
          className="h-9 text-sm"
          placeholder="Brand"
          value={filters.brand ?? ""}
          onChange={(e) => onChange({ brand: e.target.value, page: 1 })}
        />
        <Input
          className="h-9 text-sm"
          placeholder="Category"
          value={filters.category ?? ""}
          onChange={(e) => onChange({ category: e.target.value, page: 1 })}
        />
        <Input
          className="h-9 text-sm"
          placeholder="Vehicle"
          value={filters.vehicle ?? ""}
          onChange={(e) => onChange({ vehicle: e.target.value, page: 1 })}
        />
        <Select
          value={filters.stockStatus}
          onValueChange={(v) => onChange({ stockStatus: v, page: 1 })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stock</SelectItem>
            <SelectItem value="in_stock">In stock</SelectItem>
            <SelectItem value="low_stock">Low stock</SelectItem>
            <SelectItem value="out_of_stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.publicationStatus}
          onValueChange={(v) => onChange({ publicationStatus: v, page: 1 })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All publication</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
