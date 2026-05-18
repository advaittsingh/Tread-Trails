import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import {
  listProductBrands,
  listProductCategories,
  listProducts,
} from "@/lib/server/product-catalog";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
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

export default async function ProductsPage({ searchParams }: Props) {
  const raw =
    typeof searchParams.q === "string" ? searchParams.q.slice(0, 120) : "";
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category.slice(0, 80)
      : "";

  const [products, brandOptions, categoryOptions] = await Promise.all([
    listProducts(),
    listProductBrands(),
    listProductCategories(),
  ]);

  return (
    <MarketingPageShell>
      <SectionHeading
        titleAs="h1"
        eyebrow="Catalog"
        title="Curated upgrade paths"
        description="Filter by brand lineage or target vehicle — compatibility matrices stay conservative so chassis telemetry stays sane."
        className="mb-14 max-w-3xl"
      />
      <ProductsExplorer
        products={products}
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
        initialQuery={raw}
        initialCategory={category}
      />
    </MarketingPageShell>
  );
}
