import { Mountain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminDashboardData } from "@/api/dashboard/types";

export function DashboardHeader({
  brand,
  generatedAt,
  onRefresh,
  isRefreshing,
}: {
  brand: AdminDashboardData["brand"];
  generatedAt?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-stone-200 pb-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white shadow-sm">
          <Mountain className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Operations
          </p>
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
            {brand.name}
          </h1>
          <p className="text-sm text-stone-600 mt-0.5">{brand.tagline}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-stone-500">
        {generatedAt && (
          <span>
            Updated{" "}
            {new Date(generatedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-stone-300"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}
