import type { Build } from "@tread-trails/shared-types";

export function portfolioBuildPayload(b: Build) {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    vehicleSlug: b.vehicleSlug,
    summary: b.summary,
    description: b.description,
    beforeImage: b.beforeImage,
    afterImage: b.afterImage,
    gallery: b.gallery,
    productIds: b.productIds,
    homeSpotlightRank: b.homeSpotlightRank ?? null,
  };
}

export const PORTFOLIO_PRODUCT_LINK_META = {
  model:
    "Primary: PortfolioBuildProduct FK join (sortOrder). Legacy mirror: PortfolioBuild.productIds text[] (Product.legacyId / static Product.id); used when joins missing or static fallback.",
} as const;
