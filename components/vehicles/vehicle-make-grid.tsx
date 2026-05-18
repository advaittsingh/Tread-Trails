import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { VehicleHierarchyNode } from "@/lib/catalog/vehicle-hierarchy";
import { cn } from "@/lib/utils";

import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";

type VehicleMakeGridProps = {
  makes: VehicleHierarchyNode[];
};

export function VehicleMakeGrid({ makes }: VehicleMakeGridProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {makes.map((entry) => {
        const modelCount = entry.models.length;
        const variantCount = entry.models.reduce((n, m) => n + m.vehicles.length, 0);

        return (
          <li key={entry.make.slug}>
            <Link
              href={`/vehicles/${entry.make.slug}`}
              className={cn(
                "group flex h-full min-h-[168px] flex-col items-center justify-center gap-4 rounded-xl border border-border/70 bg-card p-6 shadow-card transition",
                "hover:border-primary/25 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <VehicleMakeLogo makeSlug={entry.make.slug} makeName={entry.make.name} />
              <div className="space-y-1 text-center">
                <p className="font-heading text-lg font-semibold tracking-tight text-foreground">
                  {entry.make.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {modelCount} model line{modelCount === 1 ? "" : "s"} · {variantCount} platform
                  {variantCount === 1 ? "" : "s"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                View models
                <ArrowUpRight className="size-3.5" aria-hidden />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
