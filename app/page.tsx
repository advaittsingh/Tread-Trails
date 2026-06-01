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
import { RevealSection } from "@/components/marketing/reveal-section";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Home",
  description:
    "Expedition-grade suspension, armor, lighting, and accessories for Hilux, Fortuner, Land Cruiser, Thar, Wrangler, Jimny, Endeavour-class rigs and more — explore platforms, partner-brand catalog, portfolio builds, and book studio fitting.",
  path: "/",
});

const linkBarClass =
  "text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase underline-offset-4 transition-colors duration-300 ease-tt-out hover:text-primary hover:underline";

export default async function HomePage() {
  const cars = await listVehicles();
  const brandEntries = await listBrandEntries();
  const featuredBrands = brandEntries.slice(0, 6);
  const featuredBuilds = await listHomeFeaturedBuilds(3);
  const featuredProducts = await listFeaturedProducts(4);

  return (
    <>
      <HomeHero />

      <RevealSection className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl space-y-16 overflow-x-hidden px-4 sm:px-6 lg:space-y-20 lg:px-8">
          <SectionHeading
            tone="cinematic"
            eyebrow="Platforms"
            title="Engineered for terrain"
            description="Pick a brand, model line, and generation — then open a variant hub for compatible SKUs and platform specs."
          />
          <VehicleExploreCarousel cars={cars} />
          <div className="flex justify-center pt-2">
            <Link href="/vehicles" className={linkBarClass}>
              Browse by OEM
            </Link>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="border-t border-border/30 py-24 lg:py-32" delay={0.04}>
        <div className="mx-auto max-w-7xl space-y-16 overflow-x-hidden px-4 sm:px-6 lg:space-y-20 lg:px-8">
          <SectionHeading
            tone="cinematic"
            eyebrow="Manufacturers"
            title="Curated partner systems"
            description="Each card opens that manufacturer’s brand hub — expedition-grade catalog filtered to their lineup."
          />
          <BrandExploreCarousel brands={featuredBrands} />
          <div className="flex justify-center pt-2">
            <Link href="/brands" className={linkBarClass}>
              All partner brands
            </Link>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="border-t border-border/30 py-24 lg:py-32" delay={0.06}>
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:space-y-20 lg:px-8">
          <SectionHeading
            tone="cinematic"
            eyebrow="Portfolio"
            title="Built for the wild"
            description="Real installs on real platforms — open a case study for the full narrative and parts traceability."
          />
          <div className="grid items-stretch gap-12 lg:grid-cols-3 lg:gap-14">
            {featuredBuilds.map((b, i) => {
              const vehicleName = cars.find((c) => c.slug === b.vehicleSlug)?.name;
              return (
                <BuildCard
                  key={b.id}
                  build={b}
                  vehicleName={vehicleName}
                  index={i}
                  onTextureBg
                  className="h-full"
                />
              );
            })}
          </div>
          <div className="flex justify-center">
            <Link href="/builds" className={linkBarClass}>
              Explore builds by vehicle
            </Link>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="border-t border-border/30 py-24 lg:py-32" delay={0.08}>
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:space-y-20 lg:px-8">
          <SectionHeading
            tone="cinematic"
            eyebrow="Catalog"
            title="Expedition systems"
            description="Modular upgrades with explicit vehicle compatibility — speak with our engineers before checkout."
          />
          <div className="grid items-stretch gap-10 sm:grid-cols-2 sm:gap-12 xl:grid-cols-4">
            {featuredProducts.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                onTextureBg
                emphasizeOverlay
                className="h-full"
              />
            ))}
          </div>
          <div className="flex justify-center">
            <Link href="/products" className={linkBarClass}>
              Open full catalog
            </Link>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="border-t border-border/30 py-28 lg:py-36" delay={0.1}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 px-4 text-center sm:px-6 lg:gap-14">
          <SectionHeading
            align="center"
            tone="cinematic"
            eyebrow="Concierge"
            title="Studio by appointment"
            description="Limited bay time — WhatsApp keeps your thread aligned with the technicians assigned to your chassis."
          />
          <div className="flex flex-wrap justify-center gap-4">
            <PrimaryCta href="/booking">Schedule installation</PrimaryCta>
            <WhatsAppCta
              message="Hi — I'd like to book time with Tread Trails."
              label="WhatsApp"
            />
          </div>
        </div>
      </RevealSection>
    </>
  );
}
