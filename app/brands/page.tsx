import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { listBrandEntries } from "@/lib/server/brand-catalog";

import { BrandCard } from "@/components/marketing/brand-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Brands",
  description:
    "Shop expedition-grade parts by manufacturer — curated partner brands for suspension, lighting, armor, recovery, and accessory programs.",
  path: "/brands",
});

export default async function BrandsPage() {
  const brands = await listBrandEntries();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        titleAs="h1"
        eyebrow="Manufacturers"
        title="Explore by brand"
        description="Every partner meets our OEM-adjacent QA bar — filter the catalog by the badge that matches your build thesis."
        className="mb-14 max-w-3xl"
      />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b, i) => (
          <BrandCard key={b.slug} brand={b} index={i} />
        ))}
      </div>
    </div>
  );
}
