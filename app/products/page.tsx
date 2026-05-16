import type { Metadata } from "next";

import { products } from "@/data/products";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { ProductsExplorer } from "@/components/products/products-explorer";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Products",
  description:
    "Browse expedition-grade suspension, wheels, winches, and armor — filter by partner brand and vehicle fitment, then check out with Stripe, Razorpay, Juspay, or COD.",
  path: "/products",
});

type Props = {
  searchParams: { q?: string; category?: string };
};

export default function ProductsPage({ searchParams }: Props) {
  const raw =
    typeof searchParams.q === "string" ? searchParams.q.slice(0, 120) : "";
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category.slice(0, 80)
      : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        titleAs="h1"
        eyebrow="Catalog"
        title="Curated upgrade paths"
        description="Filter by brand lineage or target vehicle — compatibility matrices stay conservative so chassis telemetry stays sane."
        className="mb-14 max-w-3xl"
      />
      <ProductsExplorer
        products={products}
        initialQuery={raw}
        initialCategory={category}
      />
    </div>
  );
}
