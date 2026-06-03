import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  PackageX,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardOperational } from "@/api/dashboard/types";
import { StatusBadge } from "./status-badge";

function StockList({
  title,
  items,
  variant,
  emptyText,
}: {
  title: string;
  items: Array<{ name: string; sku: string; available?: number; threshold?: number }>;
  variant: "low" | "out";
  emptyText: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {title}
        </h4>
        <Badge
          variant="outline"
          className={
            variant === "out"
              ? "border-red-200 text-red-800 bg-red-50"
              : "border-amber-200 text-amber-900 bg-amber-50"
          }
        >
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-stone-500 py-2">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
          {items.map((item) => (
            <li
              key={item.sku}
              className="flex items-center justify-between gap-2 rounded-md border border-stone-100 bg-stone-50/80 px-2.5 py-1.5 text-xs"
            >
              <span className="truncate font-medium text-stone-800">{item.name}</span>
              {variant === "low" && item.available != null && (
                <span className="shrink-0 tabular-nums text-amber-800 font-medium">
                  {item.available}/{item.threshold}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OperationalWidgets({
  operational,
  isLoading,
}: {
  operational?: DashboardOperational;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <Card className="md:col-span-2 border-stone-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Inventory alerts
          </CardTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link to="/inventory">Inventory</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 grid sm:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StockList
                title="Low stock"
                items={operational?.lowStockProducts ?? []}
                variant="low"
                emptyText="No low stock SKUs."
              />
              <StockList
                title="Out of stock"
                items={operational?.outOfStockProducts ?? []}
                variant="out"
                emptyText="All SKUs in stock."
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-none">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 text-stone-700" />
            Pending shipments
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <p className="text-3xl font-semibold text-stone-900 tabular-nums">
                {operational?.pendingShipments ?? 0}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Paid or packed, awaiting dispatch
              </p>
              <Button variant="link" className="h-auto p-0 mt-3 text-xs" asChild>
                <Link to="/orders?status=paid">View fulfilment queue →</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-stone-700" />
            Booking requests
          </CardTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link to="/bookings">All</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (operational?.bookingRequests ?? []).length === 0 ? (
            <p className="text-xs text-stone-500 flex items-center gap-2">
              <PackageX className="h-4 w-4" />
              No pending studio bookings.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
              {(operational?.bookingRequests ?? []).slice(0, 5).map((b) => (
                <li
                  key={b.id}
                  className="rounded-md border border-stone-100 px-2.5 py-2 text-xs"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-stone-900 truncate">
                      {b.contactName}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-stone-600 truncate mt-0.5">
                    {b.vehicleName} · {b.service}
                  </p>
                  <p className="text-stone-400 mt-0.5">
                    {b.date} {b.time}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
