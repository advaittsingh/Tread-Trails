import type { Metadata } from "next";

import { products } from "@/data/products";
import { absoluteUrl } from "@/lib/site";

import { ProductsExplorer } from "@/components/products/products-explorer";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Products",
  alternates: { canonical: absoluteUrl("/products") },
};

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Catalog"
        title="Curated upgrade paths"
        description="Filter by brand lineage or target vehicle — compatibility matrices stay conservative so chassis telemetry stays sane."
        className="mb-14 max-w-3xl"
      />
      <ProductsExplorer products={products} />
    </div>
  );
}
