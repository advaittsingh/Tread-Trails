import { Link } from "react-router-dom";
import { Gauge, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardCompatibility } from "@/api/dashboard/types";

export function CompatibilityHealth({
  compatibility,
  isLoading,
}: {
  compatibility?: DashboardCompatibility;
  isLoading?: boolean;
}) {
  const pct = compatibility?.completionPercent ?? 0;

  return (
    <Card className="border-stone-200 shadow-none h-full">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Fitment health
        </CardTitle>
        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
          <Link to="/vehicle-compatibility">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold text-stone-900 tabular-nums">
                  {pct}%
                </p>
                <p className="text-xs text-stone-500 mt-0.5">Catalog completion</p>
              </div>
              <div className="h-12 w-12 rounded-full border-4 border-stone-900 border-t-transparent flex items-center justify-center">
                <Gauge className="h-5 w-5 text-stone-700" />
              </div>
            </div>
            <Progress value={pct} className="h-2 bg-stone-100" />
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md bg-stone-50 border border-stone-100 px-3 py-2">
                <dt className="text-stone-500">Total products</dt>
                <dd className="text-lg font-semibold text-stone-900 tabular-nums mt-0.5">
                  {compatibility?.totalProducts ?? 0}
                </dd>
              </div>
              <div className="rounded-md bg-stone-50 border border-stone-100 px-3 py-2">
                <dt className="text-stone-500">With fitment</dt>
                <dd className="text-lg font-semibold text-emerald-800 tabular-nums mt-0.5">
                  {compatibility?.withFitment ?? 0}
                </dd>
              </div>
              <div className="col-span-2 rounded-md bg-amber-50/80 border border-amber-100 px-3 py-2">
                <dt className="text-amber-900/80">Missing compatibility</dt>
                <dd className="text-lg font-semibold text-amber-950 tabular-nums mt-0.5">
                  {compatibility?.missing ?? 0} SKUs need vehicle mapping
                </dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
