import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-900 border-amber-200",
  paid: "bg-emerald-50 text-emerald-900 border-emerald-200",
  packed: "bg-sky-50 text-sky-900 border-sky-200",
  shipped: "bg-indigo-50 text-indigo-900 border-indigo-200",
  delivered: "bg-stone-100 text-stone-800 border-stone-200",
  cancelled: "bg-red-50 text-red-900 border-red-200",
  new: "bg-amber-50 text-amber-900 border-amber-200",
  contacted: "bg-sky-50 text-sky-900 border-sky-200",
  qualified: "bg-violet-50 text-violet-900 border-violet-200",
  converted: "bg-emerald-50 text-emerald-900 border-emerald-200",
  closed: "bg-stone-100 text-stone-700 border-stone-200",
  confirmed: "bg-emerald-50 text-emerald-900 border-emerald-200",
  completed: "bg-stone-100 text-stone-800 border-stone-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize border text-[11px] px-2 py-0",
        STATUS_STYLES[key] ?? "bg-stone-50 text-stone-700 border-stone-200",
        className
      )}
    >
      {status}
    </Badge>
  );
}
