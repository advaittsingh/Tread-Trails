import { usePurchaseOrders } from "@/api/inventory/hooks";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-900 border-amber-200",
  in_transit: "bg-blue-50 text-blue-900 border-blue-200",
  received: "bg-emerald-50 text-emerald-900 border-emerald-200",
};

export function PurchaseOrdersTab() {
  const q = usePurchaseOrders();
  const orders = q.data?.orders ?? [];

  return (
    <div className="py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">
        Purchase Orders
      </p>

      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              <TableHead className="text-[10px] uppercase">PO Number</TableHead>
              <TableHead className="text-[10px] uppercase">Supplier</TableHead>
              <TableHead className="text-[10px] uppercase">Items</TableHead>
              <TableHead className="text-[10px] uppercase">Amount</TableHead>
              <TableHead className="text-[10px] uppercase">Status</TableHead>
              <TableHead className="text-[10px] uppercase">ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-sm text-stone-500">
                  No purchase orders linked to incoming stock.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs">{po.poNumber}</TableCell>
                  <TableCell className="text-sm">{po.supplier}</TableCell>
                  <TableCell className="tabular-nums text-sm">{po.items}</TableCell>
                  <TableCell className="text-sm tabular-nums">{formatInr(po.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        STATUS_STYLE[po.status] ?? "bg-stone-100"
                      )}
                    >
                      {po.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-stone-600">{po.eta}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
