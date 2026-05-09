import type { Metadata } from "next";

import { cars } from "@/data/cars";
import { absoluteUrl } from "@/lib/site";

import { CarCard } from "@/components/marketing/car-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Vehicles",
  alternates: { canonical: absoluteUrl("/vehicles") },
};

export default function VehiclesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
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
