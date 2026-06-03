import { Link } from "react-router-dom";
import { AlertCircle, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryInsights } from "@/api/inventory/types";

export function AutomotiveInsights({
  insights,
  isLoading,
}: {
  insights?: InventoryInsights;
  isLoading?: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3 mt-3">
      <Card className="border-stone-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car className="h-4 w-4 text-stone-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Top Vehicle Demand
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <ul className="space-y-2">
              {(insights?.topVehicleDemand ?? []).slice(0, 4).map((v) => (
                <li
                  key={v.vehicleSlug}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-stone-800 truncate">{v.vehicleName}</span>
                  <span className="text-stone-500 tabular-nums shrink-0 ml-2">
                    {v.productCount} products
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Compatibility Risk
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-stone-600 mb-1">Products Missing Fitment</p>
                <p className="text-2xl font-semibold text-stone-900 tabular-nums">
                  {insights?.productsMissingFitment ?? 0}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Coverage: {insights?.compatibilityCoveragePercent ?? 0}%
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/vehicle-compatibility">Fix Compatibility</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
