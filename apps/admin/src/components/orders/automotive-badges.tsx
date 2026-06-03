import { Badge } from "@/components/ui/badge";
import { Calendar, Link2, Wrench } from "lucide-react";
import type { OrderAutomotiveMeta } from "@/api/orders/types";
import { cn } from "@/lib/utils";

const FITMENT_STYLES: Record<OrderAutomotiveMeta["fitmentStatus"], string> = {
  verified: "bg-emerald-50 text-emerald-900 border-emerald-200",
  partial: "bg-amber-50 text-amber-900 border-amber-200",
  unverified: "bg-stone-100 text-stone-600 border-stone-200",
};

export function AutomotiveBadges({
  automotive,
  compact,
}: {
  automotive: OrderAutomotiveMeta;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", compact && "gap-0.5")}>
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5 py-0 gap-1 font-medium",
          FITMENT_STYLES[automotive.fitmentStatus]
        )}
      >
        <Link2 className="h-2.5 w-2.5" />
        {automotive.fitmentLabel}
      </Badge>
      {automotive.installationBookingStatus !== "none" && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 gap-1 bg-sky-50 text-sky-900 border-sky-200"
        >
          <Calendar className="h-2.5 w-2.5" />
          {compact
            ? automotive.installationBookingStatus
            : automotive.installationBookingLabel}
        </Badge>
      )}
      {automotive.primaryBrand && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 gap-1 bg-stone-50 text-stone-700 border-stone-200"
        >
          <Wrench className="h-2.5 w-2.5" />
          {automotive.primaryBrand}
        </Badge>
      )}
    </div>
  );
}
