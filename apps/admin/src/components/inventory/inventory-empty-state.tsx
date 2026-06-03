import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InventoryEmptyState({
  onCreatePo,
}: {
  onCreatePo?: () => void;
}) {
  return (
    <div className="my-6 rounded-lg border border-emerald-200 bg-emerald-50/50 p-8 text-center">
      <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-stone-900">Inventory looks healthy</h3>
      <p className="text-sm text-stone-600 mt-1 mb-4">
        No low stock alerts detected for the current filters.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link to="/products">View Products</Link>
        </Button>
        <Button size="sm" onClick={onCreatePo}>
          Create Purchase Order
        </Button>
      </div>
    </div>
  );
}
