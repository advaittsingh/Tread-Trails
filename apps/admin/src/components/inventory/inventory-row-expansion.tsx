import type { AdminInventoryListRow } from "@/api/inventory/types";
import { useInventoryBundle } from "@/api/inventory/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/format";

export function InventoryRowExpansion({ item }: { item: AdminInventoryListRow }) {
  const bundleQ = useInventoryBundle(item.productId);

  const warehouses = bundleQ.data?.warehouseAllocation ?? item.warehouseAllocation;
  const movements = bundleQ.data?.movements ?? [];

  return (
    <div className="grid md:grid-cols-2 gap-4 px-4 py-3 bg-stone-50/80 border-t border-stone-100">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Warehouse Allocation
        </p>
        {bundleQ.isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <ul className="space-y-1">
            {warehouses.map((w) => (
              <li key={w.warehouseId} className="flex justify-between text-sm">
                <span className="text-stone-700">
                  {w.warehouseName.replace(" Warehouse", "")}
                </span>
                <span className="font-medium tabular-nums">{w.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Recent Movements
        </p>
        {bundleQ.isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : movements.length === 0 ? (
          <p className="text-xs text-stone-500">No recent movements.</p>
        ) : (
          <ul className="space-y-1.5">
            {movements.slice(0, 4).map((m) => (
              <li key={m.id} className="text-sm flex items-start justify-between gap-2">
                <span>
                  <span
                    className={
                      m.signedQuantity.startsWith("+")
                        ? "text-emerald-700 font-medium"
                        : "text-red-700 font-medium"
                    }
                  >
                    {m.signedQuantity}
                  </span>{" "}
                  <span className="text-stone-700">{m.label}</span>
                </span>
                <span className="text-[10px] text-stone-400 shrink-0">
                  {formatShortDate(m.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
