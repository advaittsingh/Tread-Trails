import { useReorderSuggestions } from "@/api/inventory/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function ReorderSuggestionsPanel({
  onCreatePo,
}: {
  onCreatePo?: () => void;
}) {
  const q = useReorderSuggestions();
  const suggestions = q.data?.suggestions ?? [];

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Reorder Suggestions
        </p>
        {onCreatePo && (
          <Button size="sm" variant="outline" onClick={onCreatePo}>
            Create Purchase Order
          </Button>
        )}
      </div>

      <div className="border border-stone-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              <TableHead className="text-[10px] uppercase">Product</TableHead>
              <TableHead className="text-[10px] uppercase">Supplier</TableHead>
              <TableHead className="text-[10px] uppercase">Current</TableHead>
              <TableHead className="text-[10px] uppercase">Min</TableHead>
              <TableHead className="text-[10px] uppercase">Suggested</TableHead>
              <TableHead className="text-[10px] uppercase">Lead time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : suggestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-sm text-stone-500">
                  No reorder suggestions — stock levels look adequate.
                </TableCell>
              </TableRow>
            ) : (
              suggestions.map((s) => (
                <TableRow key={s.productId}>
                  <TableCell>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[10px] font-mono text-stone-500">{s.sku}</p>
                  </TableCell>
                  <TableCell className="text-sm">{s.supplier}</TableCell>
                  <TableCell className="tabular-nums text-sm">{s.current}</TableCell>
                  <TableCell className="tabular-nums text-sm">{s.min}</TableCell>
                  <TableCell className="tabular-nums text-sm font-medium text-amber-800">
                    Order {s.suggested}
                  </TableCell>
                  <TableCell className="text-sm text-stone-600">{s.leadTimeDays}d</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
