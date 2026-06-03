import { useState } from "react";
import { useInventoryMovements } from "@/api/inventory/hooks";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/format";

export function InventoryHistoryTab() {
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const histQ = useInventoryMovements({
    page,
    limit: 25,
    productId: productId || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const movements = histQ.data?.movements ?? [];

  return (
    <div className="py-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Filter by product ID"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setPage(1);
          }}
        />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              <TableHead className="text-[10px] uppercase">Date</TableHead>
              <TableHead className="text-[10px] uppercase">Action</TableHead>
              <TableHead className="text-[10px] uppercase">Qty</TableHead>
              <TableHead className="text-[10px] uppercase">Product</TableHead>
              <TableHead className="text-[10px] uppercase">User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {histQ.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-sm text-stone-500">
                  No stock movements yet.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-stone-600 whitespace-nowrap">
                    {formatShortDate(m.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">{m.label}</TableCell>
                  <TableCell
                    className={`text-sm font-medium tabular-nums ${
                      m.signedQuantity.startsWith("+")
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {m.signedQuantity}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="block truncate max-w-[180px]">{m.productName}</span>
                    <span className="text-[10px] text-stone-500 font-mono">{m.sku}</span>
                  </TableCell>
                  <TableCell className="text-sm text-stone-600">
                    {m.adminName ?? "System"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {histQ.data && (
        <AdminPagination
          page={histQ.data.page}
          totalPages={histQ.data.totalPages}
          total={histQ.data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
