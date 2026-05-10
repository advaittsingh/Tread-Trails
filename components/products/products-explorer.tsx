"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useSelectedVehicle } from "@/contexts/selected-vehicle-context";

import type { Product } from "@/data/types";
import { cars } from "@/data/cars";
import { productBrands } from "@/data/index";

import { FilterControls } from "@/components/products/filter-controls";
import { ProductCard } from "@/components/marketing/product-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ProductsExplorerProps = {
  products: Product[];
  /** URL `?q=` from SearchAction / organic deep links */
  initialQuery?: string;
};

export function ProductsExplorer({
  products,
  initialQuery = "",
}: ProductsExplorerProps) {
  const [brands, setBrands] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [textQuery, setTextQuery] = useState(() => initialQuery.trim());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { slug: storedVehicleSlug, hydrated } = useSelectedVehicle();
  const didApplyStoredFilter = useRef(false);

  useEffect(() => {
    if (!hydrated || didApplyStoredFilter.current || !storedVehicleSlug) return;
    didApplyStoredFilter.current = true;
    setVehicles((prev) => (prev.length === 0 ? [storedVehicleSlug] : prev));
  }, [hydrated, storedVehicleSlug]);

  useEffect(() => {
    setTextQuery(initialQuery.trim());
  }, [initialQuery]);

  const carOptions = useMemo(
    () => cars.map((c) => ({ slug: c.slug, name: c.name })),
    []
  );

  const textFiltered = useMemo(() => {
    const q = textQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, textQuery]);

  const filtered = useMemo(() => {
    return textFiltered.filter((p) => {
      const brandOk =
        brands.length === 0 || brands.includes(p.brand);
      const vehicleOk =
        vehicles.length === 0 ||
        p.compatibleCars.some((slug) => vehicles.includes(slug));
      return brandOk && vehicleOk;
    });
  }, [textFiltered, brands, vehicles]);

  function toggleBrand(b: string) {
    setBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  function toggleVehicle(slug: string) {
    setVehicles((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]
    );
  }

  function clearAll() {
    setBrands([]);
    setVehicles([]);
  }

  const filterProps = {
    brands: productBrands,
    cars: carOptions,
    selectedBrands: brands,
    selectedVehicles: vehicles,
    toggleBrand,
    toggleVehicle,
    clearAll,
  };

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur">
          <FilterControls {...filterProps} />
        </div>
      </aside>

      <div className="flex-1 space-y-8">
        {textQuery ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Search:{" "}
              <span className="font-medium text-foreground">&ldquo;{textQuery}&rdquo;</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setTextQuery("")}
            >
              Clear search
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            programs
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            Filters
          </Button>
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left" className="w-[min(100%,360px)] border-border/70">
              <SheetHeader>
                <SheetTitle className="font-heading tracking-[0.2em] text-primary uppercase">
                  Refine catalog
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 px-2">
                <FilterControls
                  {...filterProps}
                  className="pb-8"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-20 text-center text-sm text-muted-foreground">
            {textQuery.trim()
              ? `No products match “${textQuery.trim()}”. Try another keyword or adjust filters.`
              : "No products match these filters. Adjust brand or vehicle selection."}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
