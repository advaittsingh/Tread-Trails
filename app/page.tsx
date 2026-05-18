import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { listBrandEntries } from "@/lib/server/brand-catalog";
import { listHomeFeaturedBuilds } from "@/lib/server/build-catalog";
import { listFeaturedProducts } from "@/lib/server/product-catalog";
import { listVehicles } from "@/lib/server/vehicle-catalog";

import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";
import { BuildCard } from "@/components/marketing/build-card";
import { BrandExploreCarousel } from "@/components/marketing/brand-explore-carousel";
import { VehicleExploreCarousel } from "@/components/marketing/vehicle-explore-carousel";
import { HomeHero } from "@/components/marketing/home-hero";
import { ProductCard } from "@/components/marketing/product-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TextureBackgroundSection } from "@/components/marketing/tread-texture-section";
import { siteBackgroundUrl } from "@/lib/site-backgrounds";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Home",
  description:
    "Expedition-grade suspension, armor, lighting, and accessories for Hilux, Fortuner, Land Cruiser, Thar, Wrangler, Jimny, Endeavour-class rigs and more — explore platforms, partner-brand catalog, portfolio builds, and book studio fitting.",
  path: "/",
});

export default async function HomePage() {
  const cars = await listVehicles();
  const brandEntries = await listBrandEntries();
  const featuredBrands = brandEntries.slice(0, 6);
  const featuredBuilds = await listHomeFeaturedBuilds(3);
  const featuredProducts = await listFeaturedProducts(4);

  return (
    <>
      <HomeHero />

      <TextureBackgroundSection
        backgroundImage={siteBackgroundUrl("tread")}
        className="py-20"
        innerClassName="mx-auto max-w-7xl space-y-12 overflow-x-hidden px-4 sm:px-6 lg:px-8"
      >
        <SectionHeading
          eyebrow="Platforms"
          title="Explore by vehicle"
          description="Pick a brand, model line, and generation — then open a variant hub for compatible SKUs and platform specs. Browse the full fleet by OEM on Vehicles."
        />
        <VehicleExploreCarousel cars={cars} onTextureBg />
        <div className="flex justify-center pt-4">
          <Link
            href="/vehicles"
            className="rounded-sm text-sm tracking-wide text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse by brand
          </Link>
        </div>
      </TextureBackgroundSection>

      <TextureBackgroundSection
        backgroundImage={siteBackgroundUrl("bg3")}
        className="border-y border-border/60 py-20"
        innerClassName="mx-auto max-w-7xl space-y-12 overflow-x-hidden px-4 sm:px-6 lg:px-8"
      >
        <SectionHeading
          eyebrow="Manufacturers"
          title="Explore by brand"
          description="Each card opens that manufacturer’s brand hub — the curated catalog filtered to their lineup. Home highlights six partners; the Brands index lists every hub from the same live catalog."
        />
        <BrandExploreCarousel brands={featuredBrands} onTextureBg />
        <div className="flex justify-center pt-4">
          <Link
            href="/brands"
            className="rounded-sm text-sm tracking-wide text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-[#128C7E] hover:underline focus-visible:text-[#128C7E] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse all partner brands
          </Link>
        </div>
      </TextureBackgroundSection>

      <TextureBackgroundSection
        backgroundImage={siteBackgroundUrl("bg4")}
        className="border-y border-border/60 py-20"
        innerClassName="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8"
      >
        <SectionHeading
          eyebrow="Portfolio"
          title="Featured builds"
          description="Ordered from portfolio spotlight ranks (same catalog as /builds); open a card for the full story and parts traceability."
        />
        <div className="grid gap-10 lg:grid-cols-3">
          {featuredBuilds.map((b, i) => {
            const vehicleName = cars.find((c) => c.slug === b.vehicleSlug)?.name;
            return (
              <BuildCard
                key={b.id}
                build={b}
                vehicleName={vehicleName}
                index={i}
                onTextureBg
              />
            );
          })}
        </div>
        <div className="flex justify-center">
          <Link
            href="/builds"
            className="rounded-sm text-sm tracking-wide text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-[#128C7E] hover:underline focus-visible:text-[#128C7E] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Explore builds by vehicle
          </Link>
        </div>
      </TextureBackgroundSection>

      <TextureBackgroundSection
        backgroundImage={siteBackgroundUrl("bg5")}
        className="py-20"
        innerClassName="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8"
      >
        <SectionHeading
          eyebrow="Catalog"
          title="Featured products"
          description="Modular upgrades with explicit vehicle compatibility — speak with our engineers before checkout."
        />
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              onTextureBg
              emphasizeOverlay
            />
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            href="/products"
            className="rounded-sm text-sm tracking-wide text-black underline-offset-4 outline-none transition-colors hover:text-[#128C7E] hover:underline focus-visible:text-[#128C7E] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open full catalog
          </Link>
        </div>
      </TextureBackgroundSection>

      <TextureBackgroundSection
        backgroundImage={siteBackgroundUrl("terrain")}
        className="border-t border-border/60 py-24"
        innerClassName="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center sm:px-6"
      >
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
      </TextureBackgroundSection>
    </>
  );
}
