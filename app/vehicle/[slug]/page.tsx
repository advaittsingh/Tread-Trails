import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { excerptPlain } from "@/lib/seo/json-ld-builders";
import {
  absoluteOgAsset,
  defaultOgImage,
} from "@/lib/seo/page-metadata";
import { absoluteUrl } from "@/lib/site";
import { getBuildsForVehicle } from "@/lib/server/build-catalog";
import {
  getVehicleBySlug,
  listProductsForVehicleSlug,
  listVehicleSlugs,
} from "@/lib/server/vehicle-catalog";

import { VehicleHeroActions } from "@/components/vehicle/vehicle-hero-actions";
import { VehiclePlatformSpecs } from "@/components/vehicle/vehicle-platform-specs";
import { VehicleTabs } from "@/components/vehicle/vehicle-tabs";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  const slugs = await listVehicleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await getVehicleBySlug(params.slug);
  if (!car) return { title: "Vehicle" };
  const description = excerptPlain(car.description, 165);
  const canonical = absoluteUrl(`/vehicle/${car.slug}`);
  const heroUrl = absoluteOgAsset(car.heroImage);
  const ogImages = heroUrl
    ? [{ url: heroUrl, width: 1200, height: 630, alt: car.name }]
    : [defaultOgImage(car.name)];
  return {
    title: car.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${car.name} | Tread Trails`,
      description,
      url: canonical,
      siteName: "Tread Trails",
      locale: "en_IN",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${car.name} | Tread Trails`,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const car = await getVehicleBySlug(params.slug);
  if (!car) notFound();

  const products = await listProductsForVehicleSlug(car.slug);
  const builds = await getBuildsForVehicle(car.slug);

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
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <span className="inline-flex items-center rounded-full border border-border/80 bg-background/95 px-4 py-1.5 font-heading text-sm font-medium tracking-[0.2em] text-foreground uppercase shadow-sm backdrop-blur-sm sm:text-base md:text-lg">
                {car.category}
              </span>
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

      <VehiclePlatformSpecs
        engineSummary={car.engineSummary}
        modelYearsLabel={car.modelYearsLabel}
        trimSummary={car.trimSummary}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <VehicleTabs vehicleName={car.name} products={products} builds={builds} />
      </section>
    </>
  );
}
