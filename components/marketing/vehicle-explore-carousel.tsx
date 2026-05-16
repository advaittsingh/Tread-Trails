"use client";

import type { Car } from "@/data/types";

import { CarCard } from "@/components/marketing/car-card";
import { ExploreCarousel } from "@/components/marketing/explore-carousel";

type VehicleExploreCarouselProps = {
  cars: Car[];
};

export function VehicleExploreCarousel({ cars }: VehicleExploreCarouselProps) {
  return (
    <ExploreCarousel
      items={cars}
      getKey={(car) => car.id}
      ariaLabel="Vehicle platforms — each card links to that vehicle hub"
      renderSlide={(car, i) => (
        <CarCard
          car={car}
          index={i}
          variant="compact"
          className="w-full shrink-0"
        />
      )}
    />
  );
}
