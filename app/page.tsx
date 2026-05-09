import type { Metadata } from "next";
import Link from "next/link";

import { builds, cars, getBrandEntries, products } from "@/data/index";
import { absoluteUrl } from "@/lib/site";

import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";
import { BuildCard } from "@/components/marketing/build-card";
import { BrandCard } from "@/components/marketing/brand-card";
import { CarCard } from "@/components/marketing/car-card";
import { HomeHero } from "@/components/marketing/home-hero";
import { ProductCard } from "@/components/marketing/product-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default function HomePage() {
  const featuredBrands = getBrandEntries().slice(0, 6);
  const featuredBuilds = builds.slice(0, 3);
  const featuredProducts = products.slice(0, 4);

  return (
    <>
      <HomeHero />

      <section className="mx-auto max-w-7xl space-y-12 overflow-x-hidden px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platforms"
          title="Explore by vehicle"
          description="Each architecture carries its own kinematic signature — we engineer kits that honor factory tolerances."
        />
        <div className="min-w-0">
          <div className="flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-1 pt-0.5 scroll-px-0 [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
            {cars.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} variant="compact" />
            ))}
          </div>
        </div>
        <div className="flex justify-center pt-4">
          <Link
            href="/vehicles"
            className="text-sm tracking-wide text-primary underline-offset-4 hover:underline"
          >
            View full vehicle index
          </Link>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/10 py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Manufacturers"
            title="Explore by brand"
            description="Curated partner lines — filter by the badge that matches how you spec chassis, lighting, and recovery."
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBrands.map((b, i) => (
              <BrandCard key={b.slug} brand={b} index={i} />
            ))}
          </div>
          <div className="flex justify-center">
            <Link
              href="/brands"
              className="text-sm tracking-wide text-primary underline-offset-4 hover:underline"
            >
              View all brands
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-background py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Portfolio"
            title="Featured builds"
            description="Before and after discipline — parts lists stay traceable through to installation."
          />
          <div className="grid gap-10 lg:grid-cols-3">
            {featuredBuilds.map((b, i) => {
              const vehicleName = cars.find((c) => c.slug === b.vehicleSlug)?.name;
              return (
                <BuildCard key={b.id} build={b} vehicleName={vehicleName} index={i} />
              );
            })}
          </div>
          <div className="flex justify-center">
            <Link
              href="/builds"
              className="text-sm tracking-wide text-primary underline-offset-4 hover:underline"
            >
              Explore builds by vehicle
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Catalog"
          title="Featured products"
          description="Modular upgrades with explicit vehicle compatibility — speak with our engineers before checkout."
        />
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            href="/products"
            className="text-sm tracking-wide text-primary underline-offset-4 hover:underline"
          >
            Open full catalog
          </Link>
        </div>
      </section>

      <section className="border-t border-border/60 bg-gradient-to-br from-card/40 via-background to-background py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center sm:px-6">
          <SectionHeading
            align="center"
            eyebrow="Concierge"
            title="Book a bay or reach us instantly."
            description="Studio visits are limited — WhatsApp keeps your thread aligned with the technicians assigned to your chassis."
          />
          <div className="flex flex-wrap justify-center gap-3">
            <PrimaryCta href="/booking" className="h-11 px-8">
              Schedule installation
            </PrimaryCta>
            <WhatsAppCta
              message="Hi — I'd like to book time with Tread Trails."
              label="WhatsApp"
              className="h-11 px-8"
            />
          </div>
        </div>
      </section>
    </>
  );
}
