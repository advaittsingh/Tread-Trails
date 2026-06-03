import {
  Download,
  PackagePlus,
  RefreshCw,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function InventoryBulkBar({
  selectedCount,
  onExport,
  onBulkStock,
  onBulkReorder,
  onBulkTransfer,
  isPending,
}: {
  selectedCount: number;
  onExport: () => void;
  onBulkStock: (delta: number) => void;
  onBulkReorder: () => void;
  onBulkTransfer: () => void;
  isPending?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 border-b border-stone-100">
      {selectedCount > 0 && (
        <span className="text-xs font-medium text-stone-600 mr-1">
          {selectedCount} selected
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={isPending}>
            <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
            Bulk Stock Update
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onBulkStock(5)} disabled={selectedCount === 0}>
            Add +5 to selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkStock(-1)} disabled={selectedCount === 0}>
            Remove −1 from selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={onBulkReorder}
        disabled={selectedCount === 0 || isPending}
      >
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Bulk Reorder
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={onBulkTransfer}
        disabled={selectedCount === 0 || isPending}
      >
        <Truck className="h-3.5 w-3.5 mr-1.5" />
        Bulk Transfer
      </Button>

      <Button variant="outline" size="sm" className="h-8 text-xs ml-auto" onClick={onExport}>
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Bulk Export
      </Button>
    </div>
  );
}
