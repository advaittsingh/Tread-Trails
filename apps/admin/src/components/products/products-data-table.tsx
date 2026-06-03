import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Eye, MoreHorizontal } from "lucide-react";
import type { AdminProductListRow } from "@/api/products/types";
import { PublicationBadge } from "./publication-badge";
import { StockIndicator } from "./stock-indicator";
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
import { formatInr } from "@/lib/format";

const columnHelper = createColumnHelper<AdminProductListRow>();

export function ProductsDataTable({
  products,
  isLoading,
  rowSelection,
  onRowSelectionChange,
  onOpenProduct,
}: {
  products: AdminProductListRow[];
  isLoading?: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (s: RowSelectionState) => void;
  onOpenProduct: (id: string) => void;
}) {
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
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 36,
    }),
    columnHelper.accessor("thumbnail", {
      header: "",
      cell: (info) => {
        const src = info.getValue();
        return (
          <div className="h-10 w-10 rounded border border-stone-200 bg-stone-100 overflow-hidden shrink-0">
            {src ? (
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[9px] text-stone-400">
                N/A
              </div>
            )}
          </div>
        );
      },
      size: 48,
    }),
    columnHelper.accessor("name", {
      header: "Product",
      cell: (info) => (
        <div className="min-w-[140px]">
          <p className="font-medium text-sm text-stone-900 truncate max-w-[200px]">
            {info.getValue()}
          </p>
          <p className="text-[10px] text-stone-500 font-mono">{info.row.original.sku}</p>
        </div>
      ),
    }),
    columnHelper.accessor("brand", {
      header: "Brand",
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => (
        <span className="text-xs text-stone-600">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("compatibleVehicles", {
      header: "Vehicles",
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-xs text-stone-600 truncate max-w-[120px] block" title={v.join(", ")}>
            {v.length === 0 ? "—" : v.slice(0, 2).join(", ") + (v.length > 2 ? ` +${v.length - 2}` : "")}
          </span>
        );
      },
    }),
    columnHelper.accessor("available", {
      header: "Stock",
      cell: (info) => (
        <div className="text-sm tabular-nums">
          <span className="font-medium">{info.getValue()}</span>
          <span className="text-stone-400 text-xs"> / {info.row.original.stock}</span>
        </div>
      ),
    }),
    columnHelper.accessor("sellingPrice", {
      header: "Price",
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-sm font-medium tabular-nums">
            {v != null ? formatInr(v) : "POA"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <PublicationBadge status={row.original.publicationStatus} />
          <StockIndicator status={row.original.stockStatus} />
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
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
            <DropdownMenuItem onClick={() => onOpenProduct(row.original.id)}>
              <Eye className="h-3.5 w-3.5 mr-2" />
              View / edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  const table = useReactTable({
    data: products,
    columns,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (r) => r.id,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-stone-500">
        No products match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[calc(100vh-360px)] custom-scrollbar border-t border-stone-200">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-stone-50">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className="text-[11px] uppercase tracking-wide text-stone-500 h-10 px-3"
                >
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-stone-50"
              onClick={() => onOpenProduct(row.original.id)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2 px-3 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
