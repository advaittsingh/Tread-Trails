import type { Product } from "./types";

/** Curated partner lineup aligned with https://www.advven.com/brands (names + taglines). */
export type AdvvenPartnerBrand = {
  slug: string;
  name: string;
  tagline: string;
  logoSrc: string;
};

export const ADVVEN_PARTNER_BRANDS: AdvvenPartnerBrand[] = [
  {
    slug: "method",
    name: "Method",
    tagline: "High-performance wheels trusted by off-road enthusiasts worldwide.",
    logoSrc: "/brands/method.svg",
  },
  {
    slug: "safari",
    name: "Safari",
    tagline: "Premium snorkels and 4x4 accessories built for adventure.",
    logoSrc: "/brands/safari.svg",
  },
  {
    slug: "warn",
    name: "Warn",
    tagline: "Industry-leading winches and recovery equipment.",
    logoSrc: "/brands/warn.svg",
  },
  {
    slug: "noco-genius",
    name: "Noco Genius",
    tagline: "Innovative and reliable accessories for off-road enthusiasts.",
    logoSrc: "/brands/noco-genius.svg",
  },
  {
    slug: "arb",
    name: "ARB",
    tagline: "Comprehensive range of off-road vehicle accessories.",
    logoSrc: "/brands/arb.svg",
  },
  {
    slug: "old-man-emu",
    name: "Old Man EMU",
    tagline: "Suspension solutions engineered for optimum ride and performance.",
    logoSrc: "/brands/old-man-emu.svg",
  },
];

export function productBelongsToPartnerSlug(
  product: Product,
  slug: string
): boolean {
  const t = `${product.name} ${product.description}`.toLowerCase();
  switch (slug) {
    case "method":
      return product.brand === "Method Race Wheels";
    case "warn":
      return product.brand === "WARN Industries";
    case "arb":
      return (
        product.brand === "ARB / Old Man Emu" &&
        !/\bold man\b|nitrocharger|bp-51|mt-64|\bemu\b/i.test(product.name)
      );
    case "old-man-emu":
      return (
        product.brand === "ARB / Old Man Emu" &&
        /\bold man\b|nitrocharger|bp-51|mt-64|\bemu\b/i.test(product.name)
      );
    case "safari":
      return (
        product.brand === "Safari" ||
        /\bsafari\b|snorkel/i.test(t)
      );
    case "noco-genius":
      return (
        product.brand === "NOCO" ||
        /\bnoco\b|genius charger|genius\b/i.test(t)
      );
    default:
      return false;
  }
}

export function partnerSlugForProduct(
  product: Product
): AdvvenPartnerBrand | undefined {
  return ADVVEN_PARTNER_BRANDS.find((b) =>
    productBelongsToPartnerSlug(product, b.slug)
  );
}

/** Short label + optional logo for product cards and chips. */
export function getBrandVisualForProduct(
  product: Product
): { label: string; logoSrc?: string } {
  const partner = partnerSlugForProduct(product);
  if (partner) return { label: partner.name, logoSrc: partner.logoSrc };
  return { label: product.brand };
}

