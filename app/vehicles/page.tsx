import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { listVehicles } from "@/lib/server/vehicle-catalog";

import { CarCard } from "@/components/marketing/car-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Vehicles",
  description:
    "Explore expedition-ready platforms — Hilux, Thar, Fortuner, Wrangler-class rigs — each hub links compatible catalog SKUs, portfolio builds, and specs for that chassis.",
  path: "/vehicles",
});

export default async function VehiclesPage() {
  const cars = await listVehicles();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        titleAs="h1"
        eyebrow="Fleet intelligence"
        title="Vehicle architectures"
        description="Signal your platform — every subsequent recommendation flows from factory hardpoints and ECU logic."
        className="mb-14"
      />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {cars.map((car, i) => (
          <CarCard key={car.id} car={car} index={i} />
        ))}
      </div>
    </div>
  );
}
