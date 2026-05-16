import type { Metadata } from "next";

import { groupCarsByCategory } from "@/lib/vehicle-categories";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { listVehicles } from "@/lib/server/vehicle-catalog";

import { CarCard } from "@/components/marketing/car-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Vehicles",
  description:
    "Expedition platforms we kit and supply — Toyota, Mahindra, Jeep, Mitsubishi, Ford Endeavour, Jimny, restoration programs, and armoured utility commissions.",
  path: "/vehicles",
});

export default async function VehiclesPage() {
  const cars = await listVehicles();
  const groups = groupCarsByCategory(cars);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        titleAs="h1"
        eyebrow="Fleet intelligence"
        title="Vehicle architectures"
        description="Signal your platform — every subsequent recommendation flows from factory hardpoints and ECU logic. Armoured utility and restoration programs are listed in their own sections."
        className="mb-14"
      />
      <div className="space-y-16">
        {groups.map((group) => (
          <section key={group.category} className="space-y-8">
            <h2 className="font-heading text-xl tracking-wide text-foreground uppercase md:text-2xl">
              {group.category}
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((car, i) => (
                <CarCard key={car.id} car={car} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
