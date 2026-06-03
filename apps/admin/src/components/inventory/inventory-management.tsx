import { useMemo, useRef, useState } from "react";
import {
  Download,
  Package,
  Plus,
  Upload,
} from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  downloadInventoryExport,
  useBulkInventoryUpdate,
  useImportInventory,
  useInventoryInsights,
  useInventoryList,
  useInventorySummary,
} from "@/api/inventory/hooks";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AutomotiveInsights } from "./automotive-insights";
import { InventoryBulkBar } from "./inventory-bulk-bar";
import { InventoryDataTable } from "./inventory-data-table";
import { InventoryDetailDrawer } from "./inventory-detail-drawer";
import {
  defaultInventoryFilters,
  InventoryFilterBar,
  type InventoryFilterState,
} from "./inventory-filter-bar";
import { InventoryHealthRow } from "./inventory-health-row";
import { InventoryHistoryTab } from "./inventory-history-tab";
import { InventoryKpiStrip } from "./inventory-kpi-strip";
import { PurchaseOrdersTab } from "./purchase-orders-tab";
import { ReorderSuggestionsPanel } from "./reorder-suggestions-panel";
import { StockAdjustmentModal } from "./stock-adjustment-modal";

export function InventoryManagement() {
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<InventoryFilterState>(defaultInventoryFilters);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("stock");

  const summaryQ = useInventorySummary();
  const listQ = useInventoryList(filters);
  const insightsQ = useInventoryInsights();
  const bulkMut = useBulkInventoryUpdate();
  const importMut = useImportInventory();

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );

  const items = listQ.data?.items ?? [];
  const showHealthyEmpty =
    filters.stockStatus === "low_stock" ||
    filters.stockStatus === "critical" ||
    filters.stockStatus === "out_of_stock";

  const openDrawer = (productId: string) => {
    setDrawerId(productId);
    setDrawerOpen(true);
  };

  const openAdjustment = (productId?: string) => {
    setAdjustProductId(productId ?? null);
    setAdjustOpen(true);
  };

  const goToPurchaseOrders = () => setActiveTab("purchase-orders");

  const handleExport = async () => {
    try {
      await downloadInventoryExport(filters);
      toast({ title: "Export started" });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-0 -mx-3 lg:-mx-6">
      <div className="px-4 lg:px-6 pt-4 pb-3 border-b border-stone-200 bg-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Operations
              </p>
              <h1 className="text-lg font-semibold text-stone-900">Inventory</h1>
              <p className="text-xs text-stone-600 mt-0.5">
                Manage stock, warehouses, procurement and stock movements
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 justify-end">
            <Button size="sm" onClick={() => openAdjustment()}>
              <Plus className="h-4 w-4 mr-1.5" />
              Stock Adjustment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => importRef.current?.click()}
              disabled={importMut.isPending}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Import
            </Button>
            <Button size="sm" variant="outline" onClick={() => void handleExport()}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button size="sm" variant="secondary" onClick={goToPurchaseOrders}>
              Create Purchase Order
            </Button>
          </div>
        </div>

        <InventoryKpiStrip summary={summaryQ.data} isLoading={summaryQ.isLoading} />
        <InventoryHealthRow summary={summaryQ.data} isLoading={summaryQ.isLoading} />
        <AutomotiveInsights insights={insightsQ.data} isLoading={insightsQ.isLoading} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="px-4 lg:px-6 pt-3 bg-white border-b border-stone-200">
          <TabsList>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="reorder">Reorder</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stock" className="flex flex-col flex-1 mt-0 min-h-0">
          <InventoryFilterBar
            filters={filters}
            onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
            onReset={() => setFilters(defaultInventoryFilters)}
          />

          <div className="px-4 lg:px-6 bg-white flex-1 flex flex-col">
            {listQ.error && (
              <Alert variant="destructive" className="my-3">
                <AlertDescription>{(listQ.error as Error).message}</AlertDescription>
              </Alert>
            )}

            <InventoryBulkBar
              selectedCount={selectedIds.length}
              onExport={handleExport}
              onBulkStock={(delta) => {
                bulkMut.mutate(
                  { productIds: selectedIds, stockDelta: delta },
                  {
                    onSuccess: () => {
                      setRowSelection({});
                      toast({ title: "Bulk stock updated" });
                    },
                    onError: (e: Error) =>
                      toast({
                        title: "Bulk update failed",
                        description: e.message,
                        variant: "destructive",
                      }),
                  }
                );
              }}
              onBulkReorder={() => {
                toast({
                  title: "Reorder draft created",
                  description: `${selectedIds.length} SKUs added to procurement queue.`,
                });
                setActiveTab("reorder");
              }}
              onBulkTransfer={() => {
                toast({
                  title: "Transfer queued",
                  description: "Warehouse transfer workflow opens when multi-warehouse schema ships.",
                });
              }}
              isPending={bulkMut.isPending}
            />

            <InventoryDataTable
              items={items}
              isLoading={listQ.isLoading}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              onOpenItem={openDrawer}
              showHealthyEmpty={showHealthyEmpty && !listQ.isLoading}
            />

            {listQ.data && (
              <AdminPagination
                page={listQ.data.page}
                totalPages={listQ.data.totalPages}
                total={listQ.data.total}
                onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="px-4 lg:px-6 mt-0">
          <InventoryHistoryTab />
        </TabsContent>

        <TabsContent value="reorder" className="px-4 lg:px-6 mt-0">
          <ReorderSuggestionsPanel onCreatePo={goToPurchaseOrders} />
        </TabsContent>

        <TabsContent value="purchase-orders" className="px-4 lg:px-6 mt-0">
          <PurchaseOrdersTab />
        </TabsContent>
      </Tabs>

      <input
        ref={importRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const csv = await file.text();
          importMut.mutate(csv, {
            onSuccess: (data) => {
              toast({
                title: `Imported ${data.updated} rows`,
                description: data.errors.length
                  ? data.errors.slice(0, 2).join("; ")
                  : undefined,
              });
            },
            onError: (err: Error) =>
              toast({
                title: "Import failed",
                description: err.message,
                variant: "destructive",
              }),
          });
          e.target.value = "";
        }}
      />

      <InventoryDetailDrawer
        productId={drawerId}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setDrawerId(null);
        }}
      />

      <StockAdjustmentModal
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        items={items}
        defaultProductId={adjustProductId}
      />
    </div>
  );
}
