import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  cars,
  getBuildsForVehicle,
  getCarBySlug,
  getProductsForVehicle,
} from "@/data/index";
import { absoluteUrl } from "@/lib/site";

import { VehicleHeroActions } from "@/components/vehicle/vehicle-hero-actions";
import { VehicleTabs } from "@/components/vehicle/vehicle-tabs";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return cars.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = getCarBySlug(params.slug);
  if (!car) return { title: "Vehicle" };
  return {
    title: car.name,
    description: car.description,
    alternates: { canonical: absoluteUrl(`/vehicle/${car.slug}`) },
    openGraph: {
      title: car.name,
      description: car.description,
      url: absoluteUrl(`/vehicle/${car.slug}`),
    },
  };
}

export default function VehicleDetailPage({ params }: Props) {
  const car = getCarBySlug(params.slug);
  if (!car) notFound();

  const products = getProductsForVehicle(car.slug);
  const builds = getBuildsForVehicle(car.slug);

  return (
    <>
      <section className="relative h-[min(78vh,820px)] overflow-hidden border-b border-border/60">
        <Image
          src={car.heroImage}
          alt={car.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="font-heading text-xs tracking-[0.4em] text-primary uppercase">
                {car.category}
              </p>
              <h1 className="mt-4 font-heading text-5xl tracking-tight text-foreground md:text-7xl">
                {car.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {car.tagline}
              </p>
              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {car.description}
              </p>
            </div>
            <VehicleHeroActions vehicleSlug={car.slug} vehicleName={car.name} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <VehicleTabs vehicleName={car.name} products={products} builds={builds} />
      </section>
    </>
  );
}
