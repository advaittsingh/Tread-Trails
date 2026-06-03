import { Fragment, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ExpandedState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import type { AdminInventoryListRow } from "@/api/inventory/types";
import { InventoryRowExpansion } from "./inventory-row-expansion";
import { StockStatusBadge } from "./stock-status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryEmptyState } from "./inventory-empty-state";

const columnHelper = createColumnHelper<AdminInventoryListRow>();

function fitmentLabel(vehicles: string[]) {
  if (vehicles.length === 0) return "—";
  if (vehicles.length <= 2) return vehicles.join(" · ");
  return `${vehicles[0]} + ${vehicles.length - 1}`;
}

export function InventoryDataTable({
  items,
  isLoading,
  rowSelection,
  onRowSelectionChange,
  onOpenItem,
  showHealthyEmpty,
}: {
  items: AdminInventoryListRow[];
  isLoading?: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (state: RowSelectionState) => void;
  onOpenItem: (productId: string) => void;
  showHealthyEmpty?: boolean;
}) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      size: 40,
    }),
    columnHelper.display({
      id: "expand",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      size: 36,
    }),
    columnHelper.accessor("name", {
      header: "Product",
      cell: (info) => (
        <button
          type="button"
          className="text-left min-w-[140px]"
          onClick={() => onOpenItem(info.row.original.productId)}
        >
          <p className="font-medium text-sm text-stone-900 truncate hover:underline">
            {info.getValue()}
          </p>
          <p className="text-[10px] text-stone-500">{info.row.original.category}</p>
        </button>
      ),
    }),
    columnHelper.accessor("sku", {
      header: "SKU",
      cell: (info) => (
        <button
          type="button"
          className="font-mono text-xs text-stone-700 hover:underline"
          onClick={() => onOpenItem(info.row.original.productId)}
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor("brand", {
      header: "Brand",
      cell: (info) => (
        <span className="text-sm text-stone-700">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("compatibleVehicles", {
      header: "Vehicle Fitment",
      cell: (info) => (
        <span className="text-xs text-stone-600 max-w-[120px] truncate block">
          {fitmentLabel(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("availableQuantity", {
      header: "Available",
      cell: (info) => (
        <span className="text-sm tabular-nums font-medium">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("reservedQuantity", {
      header: "Reserved",
      cell: (info) => (
        <span className="text-sm tabular-nums text-stone-600">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("incomingQuantity", {
      header: "Incoming",
      cell: (info) => (
        <span className="text-sm tabular-nums text-blue-700">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("reorderLevel", {
      header: "Reorder Level",
      cell: (info) => (
        <span className="text-sm tabular-nums text-stone-600">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("stockStatus", {
      header: "Status",
      cell: (info) => <StockStatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onOpenItem(row.original.productId)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
      size: 40,
    }),
  ];

  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection, expanded },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    onExpandedChange: setExpanded,
    getRowId: (row) => row.productId,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableRowSelection: true,
  });

  if (!isLoading && items.length === 0 && showHealthyEmpty) {
    return <InventoryEmptyState />;
  }

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden my-3">
      <div className="overflow-x-auto max-h-[calc(100vh-22rem)] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-stone-50 z-10">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-stone-50">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[10px] uppercase tracking-wide font-semibold text-stone-600 h-9 whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-stone-500">
                  No inventory items match your filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-stone-50/80"
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    onClick={() => onOpenItem(row.original.productId)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columns.length} className="p-0">
                        <InventoryRowExpansion item={row.original} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
