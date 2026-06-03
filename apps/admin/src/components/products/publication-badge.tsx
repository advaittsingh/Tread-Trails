import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PublicationBadge({
  status,
}: {
  status: "active" | "draft";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] capitalize",
        status === "active"
          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
          : "bg-stone-100 text-stone-600 border-stone-200"
      )}
    >
      {status}
    </Badge>
  );
}
