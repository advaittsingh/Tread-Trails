"use client";

import type { BrandEntry } from "@/data/index";

import { BrandCard } from "@/components/marketing/brand-card";
import { ExploreCarousel } from "@/components/marketing/explore-carousel";
import { EXPLORE_CAROUSEL_SLIDE_CLASS } from "@/lib/explore-card-layout";

type BrandExploreCarouselProps = {
  brands: BrandEntry[];
  onTextureBg?: boolean;
};

export function BrandExploreCarousel({
  brands,
  onTextureBg = true,
}: BrandExploreCarouselProps) {
  return (
    <ExploreCarousel
      items={brands}
      getKey={(brand) => brand.slug}
      ariaLabel="Partner brands — each card links to that brand's hub page"
      renderSlide={(brand, i) => (
        <BrandCard
          brand={brand}
          index={i}
          variant="compact"
          onTextureBg={onTextureBg}
          className={EXPLORE_CAROUSEL_SLIDE_CLASS}
        />
      )}
    />
  );
}
