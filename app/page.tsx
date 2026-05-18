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
import {
  PlainSection,
  TextureBackgroundSection,
} from "@/components/marketing/tread-texture-section";
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

      {/* Categories — tire tread */}
      <TextureBackgroundSection
        backgroundImage={siteBackgroundUrl("tread")}
        className="py-20 lg:py-24"
        innerClassName="mx-auto max-w-7xl space-y-14 overflow-x-hidden px-4 sm:px-6 lg:px-8"
      >
        <SectionHeading
          tone="cinematic"
          eyebrow="Platforms"
          title="Engineered for terrain"
          description="Pick a brand, model line, and generation — then open a variant hub for compatible SKUs and platform specs."
        />
        <VehicleExploreCarousel cars={cars} onTextureBg />
        <div className="flex justify-center pt-2">
          <Link
            href="/vehicles"
            className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Browse by OEM
          </Link>
        </div>
      </TextureBackgroundSection>

      {/* Categories — brands on plain warm white */}
      <PlainSection innerClassName="space-y-14 overflow-x-hidden">
        <SectionHeading
          tone="cinematic"
          eyebrow="Manufacturers"
          title="Curated partner systems"
          description="Each card opens that manufacturer’s brand hub — expedition-grade catalog filtered to their lineup."
        />
        <BrandExploreCarousel brands={featuredBrands} />
        <div className="flex justify-center pt-2">
          <Link
            href="/brands"
            className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            All partner brands
          </Link>
        </div>
      </PlainSection>

      {/* Featured builds — plain warm white */}
      <PlainSection innerClassName="space-y-14">
        <SectionHeading
          tone="cinematic"
          eyebrow="Portfolio"
          title="Built for the wild"
          description="Real installs on real platforms — open a case study for the full narrative and parts traceability."
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
            className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Explore builds by vehicle
          </Link>
        </div>
      </PlainSection>

      {/* Services / catalog — mud texture */}
      <TextureBackgroundSection
        backgroundImage={siteBackgroundUrl("mud")}
        className="border-y border-border/50 py-20 lg:py-24"
        innerClassName="mx-auto max-w-7xl space-y-14 px-4 sm:px-6 lg:px-8"
      >
        <SectionHeading
          tone="cinematic"
          eyebrow="Catalog"
          title="Expedition systems"
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
            className="text-xs font-medium tracking-[0.2em] text-foreground uppercase underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Open full catalog
          </Link>
        </div>
      </TextureBackgroundSection>

      {/* Concierge — clean */}
      <section className="border-t border-border/50 bg-background py-24 lg:py-28">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 text-center sm:px-6">
          <SectionHeading
            align="center"
            tone="cinematic"
            eyebrow="Concierge"
            title="Studio by appointment"
            description="Limited bay time — WhatsApp keeps your thread aligned with the technicians assigned to your chassis."
          />
          <div className="flex flex-wrap justify-center gap-3">
            <PrimaryCta href="/booking">Schedule installation</PrimaryCta>
            <WhatsAppCta
              message="Hi — I'd like to book time with Tread Trails."
              label="WhatsApp"
            />
          </div>
        </div>
      </section>
    </>
  );
}
