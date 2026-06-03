"use client";

import { useMemo, useState } from "react";

import type { Build, Product } from "@/data/types";

import { BuildCard } from "@/components/marketing/build-card";
import { ProductCard } from "@/components/marketing/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type VehicleTabsProps = {
  vehicleName: string;
  products: Product[];
  builds: Build[];
};

export function VehicleTabs({
  vehicleName,
  products,
  builds,
}: VehicleTabsProps) {
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const [brand, setBrand] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const brandOk = brand === "all" || p.brand === brand;
      const catOk = category === "all" || p.category === category;
      return brandOk && catOk;
    });
  }, [products, brand, category]);

  return (
    <Tabs defaultValue="products" className="gap-8">
      <TabsList
        variant="line"
        className="h-auto w-full flex-wrap justify-start gap-1 border-b border-border/60 bg-transparent p-0 pb-3"
      >
        <TabsTrigger
          value="products"
          className="rounded-full border border-transparent px-4 py-2 data-active:border-primary/35 data-active:bg-primary/10"
        >
          Parts for sale
        </TabsTrigger>
        <TabsTrigger
          value="builds"
          className="rounded-full border border-transparent px-4 py-2 data-active:border-primary/35 data-active:bg-primary/10"
        >
          Builds
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-heading text-xs tracking-[0.3em] text-primary uppercase">
              Filter catalog
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kits validated for {vehicleName}.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label
                htmlFor="vehicle-cat-filter"
                className="text-[11px] tracking-widest text-muted-foreground uppercase"
              >
                Category
              </label>
              <select
                id="vehicle-cat-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 min-w-[180px] rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="vehicle-brand-filter"
                className="text-[11px] tracking-widest text-muted-foreground uppercase"
              >
                Brand
              </label>
              <select
                id="vehicle-brand-filter"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="flex h-10 min-w-[180px] rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-16 text-center text-sm text-muted-foreground">
            No products for this filter pairing yet.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="builds" className="space-y-8">
        {builds.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-16 text-center text-sm text-muted-foreground">
            Builds for {vehicleName} are coming online soon.
          </p>
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            {builds.map((b, i) => (
              <BuildCard key={b.id} build={b} vehicleName={vehicleName} index={i} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
