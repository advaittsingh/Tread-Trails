import type { Metadata } from "next";
import Link from "next/link";

import { products } from "@/data/index";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { listBrandEntries } from "@/lib/server/brand-catalog";
import { listHomeFeaturedBuilds } from "@/lib/server/build-catalog";
import { listVehicles } from "@/lib/server/vehicle-catalog";

import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";
import { BuildCard } from "@/components/marketing/build-card";
import { BrandCard } from "@/components/marketing/brand-card";
import { CarCard } from "@/components/marketing/car-card";
import { HomeHero } from "@/components/marketing/home-hero";
import { ProductCard } from "@/components/marketing/product-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Home",
  description:
    "Expedition-grade suspension, armor, lighting, and accessories for Hilux, Thar, Fortuner, and Wrangler-class rigs — explore vehicles, partner-brand catalog, portfolio builds, and book studio fitting.",
  path: "/",
});

export default async function HomePage() {
  const cars = await listVehicles();
  const brandEntries = await listBrandEntries();
  const featuredBrands = brandEntries.slice(0, 6);
  const featuredBuilds = await listHomeFeaturedBuilds(3);
  const featuredProducts = products.slice(0, 4);

  return (
    <>
      <HomeHero />

      <section className="mx-auto max-w-7xl space-y-12 overflow-x-hidden px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platforms"
          title="Explore by vehicle"
          description="Each card opens that vehicle’s hub — compatible catalog SKUs, portfolio builds on that chassis, and platform specs. Uses the same fleet list as Vehicles. Below each card, jump straight to portfolio builds filtered for that chassis."
        />
        <div className="min-w-0">
          <div
            className="flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-1 pt-0.5 scroll-px-0 [-ms-overflow-style:none] [scrollbar-width:thin] sm:gap-5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
            role="region"
            aria-label="Vehicle platforms — cards link to vehicle hubs; secondary links open builds filtered by chassis"
          >
            {cars.map((car, i) => (
              <div
                key={car.id}
                className="flex shrink-0 snap-start flex-col gap-2"
              >
                <CarCard car={car} index={i} variant="compact" />
                <Link
                  href={`/builds/${car.slug}`}
                  className="block rounded px-1 py-0.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Portfolio builds on this platform
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 pt-4">
          <Link
            href="/vehicles"
            className="rounded-sm text-sm tracking-wide text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse all vehicle hubs
          </Link>
          <Link
            href="/builds"
            className="rounded-sm text-sm tracking-wide text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Explore builds by platform
          </Link>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/10 py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Manufacturers"
            title="Explore by brand"
            description="Each card opens that manufacturer’s brand hub — the curated catalog filtered to their lineup. Home highlights six partners; the Brands index lists every hub from the same live catalog."
          />
          <div
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            role="region"
            aria-label="Partner brands — each card links to that brand’s hub page"
          >
            {featuredBrands.map((b, i) => (
              <BrandCard key={b.slug} brand={b} index={i} />
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/brands"
              className="rounded-sm text-sm tracking-wide text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse all partner brands
            </Link>
            <Link
              href="/products"
              className="rounded-sm text-sm tracking-wide text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Open full product catalog
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-background py-20">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Portfolio"
            title="Featured builds"
            description="Ordered from portfolio spotlight ranks (same catalog as /builds); open a card for the full story and parts traceability."
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
              className="rounded-sm text-sm tracking-wide text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            className="rounded-sm text-sm tracking-wide text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
