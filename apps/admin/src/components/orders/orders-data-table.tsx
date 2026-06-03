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
import { ChevronDown, ChevronRight, Eye, MoreHorizontal } from "lucide-react";
import type { AdminOrderListRow } from "@/api/orders/types";
import { useOrderDetail } from "@/api/orders/hooks";
import { AutomotiveBadges } from "./automotive-badges";
import { OrderRowExpansion } from "./order-row-expansion";
import { PaymentStatusBadge } from "./payment-status-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInr, formatShortDate } from "@/lib/format";

const columnHelper = createColumnHelper<AdminOrderListRow>();

function ExpandedRowContent({ order }: { order: AdminOrderListRow }) {
  const detailQ = useOrderDetail(order.id);

  return (
    <OrderRowExpansion
      order={order}
      compatibility={detailQ.data?.vehicleCompatibility}
    />
  );
}

export function OrdersDataTable({
  orders,
  isLoading,
  rowSelection,
  onRowSelectionChange,
  onOpenOrder,
}: {
  orders: AdminOrderListRow[];
  isLoading?: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (state: RowSelectionState) => void;
  onOpenOrder: (id: string) => void;
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
    columnHelper.accessor("id", {
      header: "Order ID",
      cell: (info) => (
        <button
          type="button"
          className="font-mono text-xs text-stone-800 hover:underline text-left"
          onClick={() => onOpenOrder(info.row.original.id)}
        >
          {info.getValue().slice(0, 10)}…
        </button>
      ),
    }),
    columnHelper.accessor("customerName", {
      header: "Customer",
      cell: (info) => (
        <div className="min-w-[120px]">
          <p className="font-medium text-stone-900 text-sm truncate">
            {info.getValue()}
          </p>
          <p className="text-[10px] text-stone-500 truncate">
            {info.row.original.customerPhone}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("vehicle", {
      header: "Vehicle",
      cell: (info) => (
        <span className="text-sm text-stone-700 truncate max-w-[100px] block">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("productsCount", {
      header: "Products",
      cell: (info) => (
        <span className="text-sm tabular-nums">
          {info.getValue()} ({info.row.original.itemQuantity} qty)
        </span>
      ),
    }),
    columnHelper.accessor("total", {
      header: "Total",
      cell: (info) => (
        <span className="text-sm font-medium tabular-nums">
          {formatInr(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("paymentStatus", {
      header: "Payment",
      cell: (info) => <PaymentStatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "Date",
      cell: (info) => (
        <span className="text-xs text-stone-500 whitespace-nowrap">
          {formatShortDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: "automotive",
      header: "4×4",
      cell: ({ row }) => (
        <AutomotiveBadges automotive={row.original.automotive} compact />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenOrder(row.original.id)}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => row.toggleExpanded()}>
              Toggle expansion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  const table = useReactTable({
    data: orders,
    columns,
    state: { rowSelection, expanded },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-stone-500">
        No orders match your filters.
      </div>
    );
  }

  return (
    <div className="relative overflow-auto max-h-[calc(100vh-320px)] custom-scrollbar border-t border-stone-200">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-stone-50 shadow-sm">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-stone-50">
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-[11px] uppercase tracking-wide text-stone-500 h-10 px-3 whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-stone-50/80 cursor-pointer"
                onClick={() => onOpenOrder(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2.5 px-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              {row.getIsExpanded() && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="p-0">
                    <ExpandedRowContent order={row.original} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
