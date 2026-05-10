import type { Build } from "@/data/types";
import type { PortfolioBuild as PortfolioBuildRow } from "@prisma/client";

export function prismaPortfolioBuildToBuild(p: PortfolioBuildRow): Build {
  return {
    id: p.legacyId ?? p.id,
    slug: p.slug,
    title: p.title,
    vehicleSlug: p.vehicleSlug,
    summary: p.summary,
    description: p.description,
    beforeImage: p.beforeImage,
    afterImage: p.afterImage,
    gallery: p.gallery,
    productIds: p.productIds,
    homeSpotlightRank: p.homeSpotlightRank ?? undefined,
  };
}
