import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Car } from "@/data/types";
import type { VehicleGenerationGroup } from "@/lib/catalog/vehicle-hierarchy";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

type VehicleGenerationSectionsProps = {
  groups: VehicleGenerationGroup[];
};

function VariantRow({ car }: { car: Car }) {
  return (
    <Link
      href={`/vehicle/${car.slug}`}
      className={cn(
        "group flex gap-4 rounded-lg border border-border/60 bg-card p-4 transition",
        "hover:border-primary/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted/40 sm:size-24">
        <Image
          src={car.thumbnail}
          alt=""
          fill
          sizes="96px"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
          {car.name}
        </p>
        {car.tagline ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{car.tagline}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-0.5">
          {car.modelYearsLabel ? (
            <Badge variant="secondary" className="rounded-full text-[10px] font-medium">
              {car.modelYearsLabel}
            </Badge>
          ) : null}
          {car.trimSummary ? (
            <Badge variant="outline" className="rounded-full text-[10px] font-normal">
              {car.trimSummary}
            </Badge>
          ) : null}
        </div>
      </div>
      <ArrowUpRight
        className="size-4 shrink-0 self-center text-muted-foreground transition group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}

export function VehicleGenerationSections({ groups }: VehicleGenerationSectionsProps) {
  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={group.id} className="space-y-4">
          <div className="space-y-1 border-b border-border/60 pb-3">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {group.title}
            </h2>
            {group.subtitle ? (
              <p className="text-sm text-muted-foreground">{group.subtitle}</p>
            ) : null}
          </div>
          <ul className="space-y-3">
            {group.vehicles.map((car) => (
              <li key={car.slug}>
                <VariantRow car={car} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
