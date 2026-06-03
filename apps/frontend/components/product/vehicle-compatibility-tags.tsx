"use client";

import Link from "next/link";

import type { Car } from "@/data/types";
import { cars as staticCars } from "@/data/cars";
import { useVehicleCatalog } from "@/hooks/use-vehicle-catalog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type VehicleCompatibilityTagsProps = {
  /** Vehicle slugs from `Product.compatibleCars` (DB join or static edges). */
  slugs: string[];
  /** Cap visible chips; omit to show every slug. */
  maxVisible?: number;
  className?: string;
  /** Wrap each chip in `/vehicle/[slug]`. */
  link?: boolean;
};

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function sortedVehicleCompatLabels(
  slugs: string[],
  catalog: Car[] = staticCars
) {
  return [...slugs]
    .map((slug) => {
      const car = catalog.find((c) => c.slug === slug);
      return { slug, label: car?.name ?? humanizeSlug(slug) };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function VehicleCompatibilityTags({
  slugs,
  maxVisible,
  className,
  link = false,
}: VehicleCompatibilityTagsProps) {
  const { vehicles: catalog } = useVehicleCatalog();
  if (!slugs.length) return null;

  const entries = sortedVehicleCompatLabels(slugs, catalog);
  const limit =
    maxVisible === undefined
      ? entries.length
      : Math.max(0, Math.min(entries.length, maxVisible));
  const visible = entries.slice(0, limit);
  const overflow = entries.length - visible.length;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="list"
      aria-label="Compatible vehicles"
    >
      {visible.map(({ slug, label }) => {
        const badge = (
          <Badge
            variant="outline"
            role="listitem"
            className="max-w-[11rem] truncate border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium normal-case tracking-normal text-foreground"
          >
            {label}
          </Badge>
        );
        if (link) {
          return (
            <Link key={slug} href={`/vehicle/${slug}`} className="inline-flex">
              {badge}
            </Link>
          );
        }
        return (
          <span key={slug} className="inline-flex">
            {badge}
          </span>
        );
      })}
      {overflow > 0 ? (
        <Badge
          variant="secondary"
          role="listitem"
          className="px-2.5 py-0.5 text-[11px] font-medium normal-case tracking-normal"
        >
          +{overflow} more
        </Badge>
      ) : null}
    </div>
  );
}
