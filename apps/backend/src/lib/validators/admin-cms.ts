import { z } from "zod";

export const cmsHeroSchema = z.object({
  eyebrow: z.string().max(120).optional(),
  title: z.string().max(500).optional(),
  titleAccent: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().max(2000).optional(),
  primaryCtaLabel: z.string().max(120).optional(),
  primaryCtaHref: z.string().max(500).optional(),
  secondaryCtaLabel: z.string().max(120).optional(),
  secondaryCtaHref: z.string().max(500).optional(),
});

export const cmsContentBlockSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["text", "image", "cta", "html"]),
  title: z.string().max(500).optional(),
  body: z.string().max(50000).optional(),
  imageUrl: z.string().max(2000).optional(),
  ctaLabel: z.string().max(120).optional(),
  ctaHref: z.string().max(500).optional(),
});

export const cmsHomepagePatchSchema = z.object({
  hero: cmsHeroSchema.optional(),
  featuredProductSlugs: z.array(z.string().min(1)).max(24).optional(),
  featuredBuildSlugs: z.array(z.string().min(1)).max(12).optional(),
  sectionOrder: z
    .array(
      z.enum(["platforms", "brands", "portfolio", "catalog", "concierge"])
    )
    .max(10)
    .optional(),
  sectionConfig: z.record(z.string(), z.unknown()).optional(),
});

export const cmsPagePatchSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  eyebrow: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  hero: cmsHeroSchema.optional(),
  sections: z.array(cmsContentBlockSchema).max(40).optional(),
  seoTitle: z.string().max(500).optional(),
  seoDescription: z.string().max(2000).optional(),
  published: z.boolean().optional(),
});

export const cmsBrandPatchSchema = z.object({
  bannerSrc: z.string().max(2000).optional(),
  seoTitle: z.string().max(500).optional(),
  seoDescription: z.string().max(2000).optional(),
  contentBlocks: z.array(cmsContentBlockSchema).max(30).optional(),
});

export const cmsVehiclePatchSchema = z.object({
  description: z.string().max(50000).optional(),
  heroImage: z.string().max(2000).optional(),
  thumbnail: z.string().max(2000).optional(),
  seoTitle: z.string().max(500).optional(),
  seoDescription: z.string().max(2000).optional(),
  galleryImages: z.array(z.string().max(2000)).max(30).optional(),
  contentBlocks: z.array(cmsContentBlockSchema).max(30).optional(),
});

export const cmsBuildPatchSchema = z.object({
  description: z.string().max(50000).optional(),
  contentHtml: z.string().max(100000).optional(),
  gallery: z.array(z.string().max(2000)).max(50).optional(),
  videoEmbeds: z.array(z.string().max(2000)).max(12).optional(),
  seoTitle: z.string().max(500).optional(),
  seoDescription: z.string().max(2000).optional(),
  homeSpotlightRank: z.number().int().min(0).max(999).nullable().optional(),
});

export const CMS_PAGE_SLUGS = ["about", "contact", "corporate-inquiry"] as const;

export type CmsPageSlug = (typeof CMS_PAGE_SLUGS)[number];

export const DEFAULT_SECTION_ORDER = [
  "platforms",
  "brands",
  "portfolio",
  "catalog",
  "concierge",
] as const;

export const DEFAULT_HERO = {
  eyebrow: "Expedition atelier",
  title: "Terrain,",
  titleAccent: "refined.",
  description:
    "Vehicle-native kits, armor, and lighting programs engineered with OEM discipline — delivered with boutique studio care.",
  imageUrl:
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2400&q=80",
  primaryCtaLabel: "Book appointment",
  primaryCtaHref: "/booking",
  secondaryCtaLabel: "Explore vehicles",
  secondaryCtaHref: "/vehicles",
};
