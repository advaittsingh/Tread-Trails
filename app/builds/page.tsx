import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { listVehicles } from "@/lib/server/vehicle-catalog";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { CarCard } from "@/components/marketing/car-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Builds",
  description:
    "Portfolio transformations by chassis — before/after installs, linked products, and narratives from real Tread Trails expedition builds.",
  path: "/builds",
});

export default async function BuildsPage() {
  const cars = await listVehicles();

  return (
    <MarketingPageShell>
      <SectionHeading
        titleAs="h1"
        eyebrow="Case studies"
        title="Explore builds by platform"
        description="Choose your chassis — we surface every portfolio row filmed on that architecture. Open a build for the full narrative, then mirror parts on your own vehicle."
        className="mb-14 max-w-3xl"
      />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {cars.map((car, i) => (
          <CarCard key={car.id} car={car} index={i} href={`/builds/${car.slug}`} />
        ))}
      </div>
    </MarketingPageShell>
  );
}
