import { useMemo, useState } from "react";
import { Plus, Tags } from "lucide-react";
import {
  downloadProductsExport,
  useBulkUpdateProducts,
  useProductsList,
  useProductsSummary,
} from "@/api/products/hooks";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProductCreateWizard } from "./product-create-wizard";
import { ProductDetailDrawer } from "./product-detail-drawer";
import { ProductsBulkBar } from "./products-bulk-bar";
import { ProductsDataTable } from "./products-data-table";
import {
  defaultProductFilters,
  ProductsFilterBar,
  type ProductsFilterState,
} from "./products-filter-bar";
import { ProductsKpiStrip } from "./products-kpi-strip";
import { InventoryMonitor } from "./inventory-monitor";
import type { RowSelectionState } from "@tanstack/react-table";

export function ProductsManagement() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ProductsFilterState>(defaultProductFilters);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const summaryQ = useProductsSummary();
  const listQ = useProductsList(filters);
  const bulkMut = useBulkUpdateProducts();

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  );

  return (
    <div className="flex flex-col min-h-0 -mx-3 lg:-mx-6">
      <div className="px-4 lg:px-6 pt-4 pb-3 border-b border-stone-200 bg-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Catalog
              </p>
              <h1 className="text-lg font-semibold text-stone-900">
                Products · Tread Trails India
              </h1>
              <InventoryMonitor summary={summaryQ.data} />
            </div>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add product
          </Button>
        </div>
        <ProductsKpiStrip summary={summaryQ.data} isLoading={summaryQ.isLoading} />
      </div>

      <ProductsFilterBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onReset={() => setFilters(defaultProductFilters)}
      />

      <div className="px-4 lg:px-6 bg-white flex-1 flex flex-col">
        {listQ.error && (
          <Alert variant="destructive" className="my-3">
            <AlertDescription>{(listQ.error as Error).message}</AlertDescription>
          </Alert>
        )}

        <ProductsBulkBar
          selectedCount={selectedIds.length}
          onExport={async () => {
            try {
              await downloadProductsExport(filters);
              toast({ title: "Export started" });
            } catch (e) {
              toast({
                title: "Export failed",
                description: e instanceof Error ? e.message : "Error",
                variant: "destructive",
              });
            }
          }}
          onBulk={(payload) => {
            bulkMut.mutate(
              { ids: selectedIds, ...payload },
              {
                onSuccess: () => {
                  setRowSelection({});
                  toast({ title: "Bulk update applied" });
                },
                onError: (e: Error) =>
                  toast({
                    title: "Bulk failed",
                    description: e.message,
                    variant: "destructive",
                  }),
              }
            );
          }}
          isPending={bulkMut.isPending}
        />

        <ProductsDataTable
          products={listQ.data?.products ?? []}
          isLoading={listQ.isLoading}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onOpenProduct={(id) => {
            setDrawerId(id);
            setDrawerOpen(true);
          }}
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

      <ProductDetailDrawer
        productId={drawerId}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setDrawerId(null);
        }}
      />

      <ProductCreateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={(id) => {
          setDrawerId(id);
          setDrawerOpen(true);
        }}
      />
    </div>
  );
}
