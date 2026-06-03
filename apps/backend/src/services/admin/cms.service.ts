import type { Prisma } from "@prisma/client";

import { prismaPortfolioBuildToBuild } from "../../lib/catalog/map-portfolio-build.js";
import { prismaProductToDTO, productWithVehicleCompatInclude } from "../../lib/catalog/map-product.js";
import { prisma } from "../../lib/prisma.js";
import {
  CMS_PAGE_SLUGS,
  DEFAULT_HERO,
  DEFAULT_SECTION_ORDER,
  type CmsPageSlug,
} from "../../lib/validators/admin-cms.js";

const PAGE_DEFAULTS: Record<
  CmsPageSlug,
  { title: string; eyebrow: string; description: string }
> = {
  about: {
    title: "About Tread Trails",
    eyebrow: "Studio",
    description:
      "Meet Tread Trails — expedition chassis tuning, curated accessories, portfolio installs, and boutique studio fitting.",
  },
  contact: {
    title: "Contact the studio",
    eyebrow: "Concierge",
    description:
      "Reach Tread Trails for expedition upgrades, bay bookings, and fleet questions.",
  },
  "corporate-inquiry": {
    title: "Corporate & fleet",
    eyebrow: "Partnerships",
    description:
      "Fleet programmes, reseller partnerships, and corporate procurement for expedition-grade upgrades.",
  },
};

export async function ensureCmsHomepage() {
  return prisma.cmsHomepage.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      hero: DEFAULT_HERO as Prisma.InputJsonValue,
      sectionOrder: [...DEFAULT_SECTION_ORDER],
    },
    update: {},
  });
}

export async function ensureCmsPages() {
  for (const slug of CMS_PAGE_SLUGS) {
    const defaults = PAGE_DEFAULTS[slug];
    await prisma.cmsPage.upsert({
      where: { slug },
      create: {
        slug,
        title: defaults.title,
        eyebrow: defaults.eyebrow,
        description: defaults.description,
        sections: [],
      },
      update: {},
    });
  }
}

export function mapCmsHomepage(row: {
  hero: unknown;
  featuredProductSlugs: string[];
  featuredBuildSlugs: string[];
  sectionOrder: string[];
  sectionConfig: unknown;
  updatedAt: Date;
}) {
  const hero =
    row.hero && typeof row.hero === "object" && !Array.isArray(row.hero)
      ? { ...DEFAULT_HERO, ...(row.hero as Record<string, unknown>) }
      : DEFAULT_HERO;

  return {
    hero,
    featuredProductSlugs: row.featuredProductSlugs,
    featuredBuildSlugs: row.featuredBuildSlugs,
    sectionOrder: row.sectionOrder.length
      ? row.sectionOrder
      : [...DEFAULT_SECTION_ORDER],
    sectionConfig: row.sectionConfig ?? {},
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapCmsPage(row: {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  hero: unknown;
  sections: unknown;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  updatedAt: Date;
}) {
  return {
    slug: row.slug,
    title: row.title,
    eyebrow: row.eyebrow,
    description: row.description,
    hero: row.hero ?? {},
    sections: Array.isArray(row.sections) ? row.sections : [],
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    published: row.published,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getPublicHomepageCms() {
  const row = await ensureCmsHomepage();
  const cms = mapCmsHomepage(row);

  const [products, builds] = await Promise.all([
    cms.featuredProductSlugs.length
      ? prisma.product.findMany({
          where: { slug: { in: cms.featuredProductSlugs } },
          include: productWithVehicleCompatInclude,
        })
      : prisma.product.findMany({
          where: { homeFeaturedRank: { not: null } },
          orderBy: { homeFeaturedRank: "asc" },
          take: 4,
          include: productWithVehicleCompatInclude,
        }),
    cms.featuredBuildSlugs.length
      ? prisma.portfolioBuild.findMany({
          where: { slug: { in: cms.featuredBuildSlugs } },
        })
      : prisma.portfolioBuild.findMany({
          where: { homeSpotlightRank: { not: null } },
          orderBy: { homeSpotlightRank: "asc" },
          take: 3,
        }),
  ]);

  const productOrder = new Map(
    cms.featuredProductSlugs.map((s, i) => [s, i])
  );
  const buildOrder = new Map(cms.featuredBuildSlugs.map((s, i) => [s, i]));

  const sortedProducts = [...products].sort((a, b) => {
    const ia = productOrder.get(a.slug) ?? a.homeFeaturedRank ?? 999;
    const ib = productOrder.get(b.slug) ?? b.homeFeaturedRank ?? 999;
    return ia - ib;
  });

  const sortedBuilds = [...builds].sort((a, b) => {
    const ia = buildOrder.get(a.slug) ?? a.homeSpotlightRank ?? 999;
    const ib = buildOrder.get(b.slug) ?? b.homeSpotlightRank ?? 999;
    return ia - ib;
  });

  return {
    ...cms,
    featuredProducts: sortedProducts.map((p) => prismaProductToDTO(p)),
    featuredBuilds: sortedBuilds.map((b) => prismaPortfolioBuildToBuild(b)),
  };
}

export async function listCmsPickerOptions() {
  const [products, builds, brands, vehicles] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, homeFeaturedRank: true },
    }),
    prisma.portfolioBuild.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        homeSpotlightRank: true,
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.vehicle.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    }),
  ]);

  return { products, builds, brands, vehicles };
}
