import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrdersFilterParams } from "@/api/orders/types";

const ORDER_STATUSES = [
  "all",
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_CHANNELS = ["all", "stripe", "cod", "razorpay", "juspay"];
const PAYMENT_STATUSES = ["all", "unpaid", "captured", "refunded"];

export type OrdersFilterState = OrdersFilterParams & {
  status: string;
  payment: string;
  paymentStatus: string;
};

export const defaultOrdersFilters: OrdersFilterState = {
  search: "",
  customerName: "",
  phone: "",
  vehicle: "",
  brand: "",
  status: "all",
  payment: "all",
  paymentStatus: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 25,
};

export function OrdersFilterBar({
  filters,
  onChange,
  onReset,
}: {
  filters: OrdersFilterState;
  onChange: (patch: Partial<OrdersFilterState>) => void;
  onReset: () => void;
}) {
  const hasActive =
    filters.search ||
    filters.phone ||
    filters.vehicle ||
    filters.brand ||
    filters.status !== "all" ||
    filters.payment !== "all" ||
    filters.paymentStatus !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="h-4 w-4 text-stone-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          Filters
        </span>
        {hasActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={onReset}
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        <div className="col-span-2 md:col-span-2">
          <Label className="sr-only">Search order ID</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="Order ID"
              value={filters.search ?? ""}
              onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            />
          </div>
        </div>
        <div>
          <Input
            className="h-9 text-sm"
            placeholder="Customer name"
            value={filters.customerName ?? ""}
            onChange={(e) => onChange({ customerName: e.target.value, page: 1 })}
          />
        </div>
        <div>
          <Input
            className="h-9 text-sm"
            placeholder="Phone"
            value={filters.phone ?? ""}
            onChange={(e) => onChange({ phone: e.target.value, page: 1 })}
          />
        </div>
        <div>
          <Input
            className="h-9 text-sm"
            placeholder="Vehicle"
            value={filters.vehicle ?? ""}
            onChange={(e) => onChange({ vehicle: e.target.value, page: 1 })}
          />
        </div>
        <div>
          <Input
            className="h-9 text-sm"
            placeholder="Brand"
            value={filters.brand ?? ""}
            onChange={(e) => onChange({ brand: e.target.value, page: 1 })}
          />
        </div>
        <div>
          <Select
            value={filters.status}
            onValueChange={(v) => onChange({ status: v, page: 1 })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={filters.paymentStatus}
            onValueChange={(v) => onChange({ paymentStatus: v, page: 1 })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "Payment status" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
        <div>
          <Select
            value={filters.payment}
            onValueChange={(v) => onChange({ payment: v, page: 1 })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Gateway" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_CHANNELS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All gateways" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            type="date"
            className="h-9 text-sm"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onChange({ dateFrom: e.target.value, page: 1 })}
          />
        </div>
        <div>
          <Input
            type="date"
            className="h-9 text-sm"
            value={filters.dateTo ?? ""}
            onChange={(e) => onChange({ dateTo: e.target.value, page: 1 })}
          />
        </div>
      </div>
    </div>
  );
}
