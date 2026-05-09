import type { Metadata } from "next";

import { cars } from "@/data/index";
import { absoluteUrl } from "@/lib/site";

import { CarCard } from "@/components/marketing/car-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Builds",
  alternates: { canonical: absoluteUrl("/builds") },
};

export default function BuildsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
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
    </div>
  );
}
