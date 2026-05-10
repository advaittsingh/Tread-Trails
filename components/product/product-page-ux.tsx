"use client";

import { useEffect, useState } from "react";

import { getProductBySlug } from "@/data/index";
import type { Product } from "@/data/types";
import {
  getRecentProductSlugs,
  recordProductView,
} from "@/lib/recently-viewed";

import { ProductCard } from "@/components/marketing/product-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export function ProductPageUx({ currentSlug }: { currentSlug: string }) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    recordProductView(currentSlug);
    const slugs = getRecentProductSlugs(currentSlug);
    const resolved = slugs
      .map((s) => getProductBySlug(s))
      .filter(Boolean) as Product[];
    setRecentProducts(resolved);
  }, [currentSlug]);

  if (recentProducts.length === 0) return null;

  return (
    <section className="mt-20 space-y-8 border-t border-border/60 pt-16">
      <SectionHeading
        eyebrow="History"
        title="Recently viewed"
        description="Tracked locally in this browser — jump back to accessories you were comparing."
        className="mb-0 max-w-xl"
      />
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {recentProducts.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
