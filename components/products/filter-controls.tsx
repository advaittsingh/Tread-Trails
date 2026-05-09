"use client";

import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type FilterControlsProps = {
  brands: string[];
  cars: { slug: string; name: string }[];
  selectedBrands: string[];
  selectedVehicles: string[];
  toggleBrand: (b: string) => void;
  toggleVehicle: (slug: string) => void;
  clearAll: () => void;
  className?: string;
};

export function FilterControls({
  brands,
  cars,
  selectedBrands,
  selectedVehicles,
  toggleBrand,
  toggleVehicle,
  clearAll,
  className,
}: FilterControlsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-heading text-xs tracking-[0.25em] text-primary uppercase">
          <SlidersHorizontal className="size-4" />
          Filters
        </span>
        <Button type="button" variant="ghost" size="xs" onClick={clearAll}>
          Clear
        </Button>
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="text-[11px] tracking-widest text-muted-foreground uppercase">
          Brand
        </Label>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => {
            const on = selectedBrands.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggleBrand(b)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  on
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="text-[11px] tracking-widest text-muted-foreground uppercase">
          Vehicle fitment
        </Label>
        <ul className="space-y-2">
          {cars.map((c) => {
            const on = selectedVehicles.includes(c.slug);
            return (
              <li key={c.slug}>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleVehicle(c.slug)}
                    className="size-4 rounded border-input accent-primary"
                  />
                  {c.name}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
      {(selectedBrands.length > 0 || selectedVehicles.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedBrands.map((b) => (
            <Badge key={b} variant="secondary" className="rounded-full">
              {b}
            </Badge>
          ))}
          {selectedVehicles.map((slug) => (
            <Badge key={slug} variant="outline" className="rounded-full border-primary/30">
              {cars.find((x) => x.slug === slug)?.name ?? slug}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
