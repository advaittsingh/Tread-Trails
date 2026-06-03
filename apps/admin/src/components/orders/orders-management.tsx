import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import {
  downloadOrdersExport,
  useBulkUpdateOrders,
  useOrdersList,
  useOrdersSummary,
} from "@/api/orders/hooks";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { OrdersBulkBar } from "./orders-bulk-bar";
import { OrdersDataTable } from "./orders-data-table";
import {
  defaultOrdersFilters,
  OrdersFilterBar,
  type OrdersFilterState,
} from "./orders-filter-bar";
import { OrdersKpiStrip } from "./orders-kpi-strip";
import type { RowSelectionState } from "@tanstack/react-table";

export function OrdersManagement() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<OrdersFilterState>(defaultOrdersFilters);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const summaryQ = useOrdersSummary();
  const listQ = useOrdersList(filters);
  const bulkMut = useBulkUpdateOrders();

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );

  const openOrder = (id: string) => {
    setDrawerOrderId(id);
    setDrawerOpen(true);
  };

  const handleBulkStatus = async (status: string, carrier?: string) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkMut.mutateAsync({
        ids: selectedIds,
        status,
        shippingCarrier: carrier,
      });
      setRowSelection({});
      toast({
        title: "Bulk update complete",
        description: `${selectedIds.length} orders updated.`,
      });
    } catch (e) {
      toast({
        title: "Bulk update failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      await downloadOrdersExport(filters);
      toast({ title: "Export started" });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    }
  };

  const handlePrintLabels = () => {
    const lines = selectedIds.length > 0 ? selectedIds : listQ.data?.orders.map((o) => o.id) ?? [];
    const html = `<!DOCTYPE html><html><head><title>Tread Trails — Shipping Labels</title>
      <style>body{font-family:system-ui;padding:24px} .label{border:1px solid #ccc;padding:16px;margin-bottom:16px;page-break-after:always}</style></head><body>
      ${lines.map((id) => `<div class="label"><strong>Tread Trails India</strong><br/>Order: ${id}</div>`).join("")}
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="flex flex-col min-h-0 -mx-3 lg:-mx-6">
      <div className="px-4 lg:px-6 pt-4 pb-3 border-b border-stone-200 bg-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Commerce
            </p>
            <h1 className="text-lg font-semibold text-stone-900">
              Orders · Tread Trails India
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Fulfilment, payments, and 4×4 fitment-aware order operations
            </p>
          </div>
        </div>
        <OrdersKpiStrip summary={summaryQ.data} isLoading={summaryQ.isLoading} />
      </div>

      <OrdersFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={() => setFilters(defaultOrdersFilters)}
      />

      <div className="px-4 lg:px-6 bg-white flex-1 flex flex-col min-h-0">
        {listQ.error && (
          <Alert variant="destructive" className="my-3">
            <AlertDescription>
              {(listQ.error as Error).message}
            </AlertDescription>
          </Alert>
        )}

        <OrdersBulkBar
          selectedCount={selectedIds.length}
          onBulkStatus={handleBulkStatus}
          onExport={handleExport}
          onPrintLabels={handlePrintLabels}
          isUpdating={bulkMut.isPending}
        />

        <OrdersDataTable
          orders={listQ.data?.orders ?? []}
          isLoading={listQ.isLoading}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onOpenOrder={openOrder}
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

      <OrderDetailDrawer
        orderId={drawerOrderId}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setDrawerOrderId(null);
        }}
      />
    </div>
  );
}
