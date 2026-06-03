import { Link, useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardOrderRow } from "@/api/dashboard/types";
import { formatInr, formatShortDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

const columnHelper = createColumnHelper<DashboardOrderRow>();

const columns = [
  columnHelper.accessor("id", {
    header: "Order ID",
    cell: (info) => (
      <span className="font-mono text-xs text-stone-700">
        {info.getValue().slice(0, 10)}…
      </span>
    ),
  }),
  columnHelper.accessor("customer", {
    header: "Customer",
    cell: (info) => (
      <span className="font-medium text-stone-900 truncate max-w-[140px] block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("vehicle", {
    header: "Vehicle",
    cell: (info) => (
      <span className="text-stone-600 truncate max-w-[120px] block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => (
      <span className="tabular-nums font-medium">{formatInr(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => (
      <span className="text-stone-500 text-xs whitespace-nowrap">
        {formatShortDate(info.getValue())}
      </span>
    ),
  }),
];

export function RecentOrdersTable({
  orders,
  isLoading,
}: {
  orders: DashboardOrderRow[];
  isLoading?: boolean;
}) {
  const navigate = useNavigate();
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rowModel = table.getRowModel();

  return (
    <Card className="border-stone-200 shadow-none mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-semibold">Recent orders</CardTitle>
        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
          <Link to="/orders">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="px-4 pb-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-stone-500 px-4 pb-4">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="bg-stone-50/80 hover:bg-stone-50/80">
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-[11px] uppercase tracking-wide text-stone-500 h-9 px-4"
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
                {rowModel.rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-stone-50"
                    onClick={() => navigate(`/orders/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5 px-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
