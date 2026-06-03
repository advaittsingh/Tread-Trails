import { z } from "zod";

export const seoSettingsPatchSchema = z.object({
  siteName: z.string().min(1).max(120).optional(),
  titleTemplate: z.string().min(1).max(200).optional(),
  defaultMetaDescription: z.string().max(2000).optional(),
  defaultOgImage: z.string().max(2000).optional(),
  defaultRobots: z.string().max(120).optional(),
  canonicalBaseUrl: z.string().max(500).optional(),
  organizationSchema: z.record(z.string(), z.unknown()).optional(),
  productSchema: z.record(z.string(), z.unknown()).optional(),
  brandSchema: z.record(z.string(), z.unknown()).optional(),
});

export const seoRoutePatchSchema = z.object({
  label: z.string().max(200).optional(),
  metaTitle: z.string().max(500).optional(),
  metaDescription: z.string().max(2000).optional(),
  canonicalUrl: z.string().max(2000).optional(),
  ogImageUrl: z.string().max(2000).optional(),
  robots: z.string().max(120).optional(),
});

export const seoRouteCreateSchema = seoRoutePatchSchema.extend({
  path: z.string().min(1).max(500),
  label: z.string().max(200).optional().default(""),
});

export const DEFAULT_SEO_ROUTES = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/corporate-inquiry", label: "Corporate" },
  { path: "/products", label: "Products" },
  { path: "/brands", label: "Brands" },
  { path: "/vehicles", label: "Vehicles" },
  { path: "/builds", label: "Builds" },
  { path: "/booking", label: "Booking" },
] as const;

export const DEFAULT_ORGANIZATION_SCHEMA = {
  "@type": "Organization",
  name: "Tread Trails",
  description:
    "Expedition-grade automotive upgrades — chassis tuning, armor, lighting, curated accessories, portfolio installs, and concierge studio fitting in India and the UAE.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bengaluru",
    addressCountry: "IN",
  },
  areaServed: ["IN", "AE"],
};

export const DEFAULT_PRODUCT_SCHEMA = {
  enabled: true,
  includeOffers: true,
  availabilityInStock: "https://schema.org/InStock",
  availabilityQuote: "https://schema.org/PreOrder",
  descriptionMaxLength: 5000,
};

export const DEFAULT_BRAND_SCHEMA = {
  enabled: true,
  includeLogo: true,
};
