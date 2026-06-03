import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  unpaid: "bg-amber-50 text-amber-900 border-amber-200",
  captured: "bg-emerald-50 text-emerald-900 border-emerald-200",
  refunded: "bg-red-50 text-red-800 border-red-200",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] capitalize font-medium",
        STYLES[status] ?? "bg-stone-50 text-stone-700"
      )}
    >
      {status}
    </Badge>
  );
}
