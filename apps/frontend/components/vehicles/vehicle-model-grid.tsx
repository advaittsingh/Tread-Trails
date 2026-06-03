import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import type { VehicleHierarchyNode } from "@/lib/catalog/vehicle-hierarchy";
import { cn } from "@/lib/utils";

type VehicleModelGridProps = {
  makeSlug: string;
  models: VehicleHierarchyNode["models"];
};

export function VehicleModelGrid({ makeSlug, models }: VehicleModelGridProps) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {models.map((entry) => {
        const thumb = entry.vehicles[0]?.thumbnail;
        const count = entry.vehicles.length;

        return (
          <li key={entry.model.slug}>
            <Link
              href={`/vehicles/${makeSlug}/${entry.model.slug}`}
              className={cn(
                "group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card transition",
                "hover:border-primary/25 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="relative aspect-[16/10] bg-muted/40">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-heading text-3xl font-semibold text-muted-foreground/40">
                    {entry.model.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
                  {entry.model.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {count} generation{count === 1 ? "" : "s"} & variant{count === 1 ? "" : "s"}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Choose year & generation
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
