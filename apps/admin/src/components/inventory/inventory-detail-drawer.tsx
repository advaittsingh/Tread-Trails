import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoryBundle } from "@/api/inventory/hooks";
import { StockStatusBadge } from "./stock-status-badge";
import { formatInr, formatShortDate } from "@/lib/format";

export function InventoryDetailDrawer({
  productId,
  open,
  onOpenChange,
}: {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const q = useInventoryBundle(productId);
  const item = q.data?.item;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-white z-10">
          <SheetTitle className="text-left text-base">
            {item?.name ?? "Inventory detail"}
          </SheetTitle>
          {item && (
            <div className="flex flex-wrap gap-2 pt-1">
              <StockStatusBadge status={item.stockStatus} />
              <span className="text-xs font-mono text-stone-500">{item.sku}</span>
            </div>
          )}
        </SheetHeader>

        <div className="px-6 py-4">
          {q.isLoading && <Skeleton className="h-48 w-full" />}

          {item && (
            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="movements" className="text-xs">
                  Stock Movements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-5 mt-0">
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Overview
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-stone-500 text-xs">Product</dt>
                      <dd className="font-medium">{item.name}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500 text-xs">SKU</dt>
                      <dd className="font-mono text-xs">{item.sku}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500 text-xs">Brand</dt>
                      <dd>{item.brand}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500 text-xs">Category</dt>
                      <dd>{item.category}</dd>
                    </div>
                    {item.price != null && (
                      <div className="col-span-2">
                        <dt className="text-stone-500 text-xs">Unit price</dt>
                        <dd>{formatInr(item.price)}</dd>
                      </div>
                    )}
                  </dl>
                </section>

                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Stock Summary
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Available", value: item.availableQuantity },
                      { label: "Reserved", value: item.reservedQuantity },
                      { label: "Incoming", value: item.incomingQuantity },
                      { label: "Damaged", value: item.damagedQuantity },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-md border border-stone-200 px-3 py-2"
                      >
                        <p className="text-[10px] text-stone-500">{s.label}</p>
                        <p className="text-lg font-semibold tabular-nums">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Warehouse Allocation
                  </p>
                  <ul className="space-y-1.5">
                    {(q.data?.warehouseAllocation ?? []).map((w) => (
                      <li
                        key={w.warehouseId}
                        className="flex justify-between text-sm border-b border-stone-100 pb-1"
                      >
                        <span>{w.warehouseName.replace(" Warehouse", "")}</span>
                        <span className="font-medium tabular-nums">{w.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Compatibility
                  </p>
                  {item.compatibleVehicles.length === 0 ? (
                    <p className="text-sm text-amber-700">No fitment data — add compatibility.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-1.5">
                      {item.compatibleVehicles.map((v) => (
                        <li
                          key={v}
                          className="text-xs bg-stone-100 text-stone-800 px-2 py-0.5 rounded"
                        >
                          {v}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="movements" className="mt-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-3">
                  Recent Movements
                </p>
                {(q.data?.movements ?? []).length === 0 ? (
                  <p className="text-sm text-stone-500">No movements recorded.</p>
                ) : (
                  <ul className="space-y-3 border-l-2 border-stone-200 ml-2 pl-4">
                    {(q.data?.movements ?? []).map((m) => (
                      <li key={m.id} className="relative">
                        <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-stone-800" />
                        <p className="text-sm font-medium">
                          <span
                            className={
                              m.signedQuantity.startsWith("+")
                                ? "text-emerald-700"
                                : "text-red-700"
                            }
                          >
                            {m.signedQuantity}
                          </span>{" "}
                          {m.label}
                        </p>
                        <p className="text-xs text-stone-600">
                          {m.adminName ?? "System"} · {formatShortDate(m.createdAt)}
                        </p>
                        {m.note ? (
                          <p className="text-xs text-stone-500">{m.note}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
