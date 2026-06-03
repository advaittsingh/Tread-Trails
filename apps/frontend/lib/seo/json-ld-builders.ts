import type { Product } from "@/data/types";
import { absoluteUrl } from "@/lib/site";
import {
  siteContactEmail,
  siteSocialSameAs,
} from "@/lib/site-marketing";

export type BreadcrumbJsonLdItem = {
  name: string;
  /** Absolute URL for this step; omit on current page if preferred */
  item?: string;
};

export function excerptPlain(text: string, max = 160): string {
  const single = text.replace(/\s+/g, " ").trim();
  if (single.length <= max) return single;
  return `${single.slice(0, max - 1)}…`;
}

export function getOrganizationJsonLd(
  overrides?: Record<string, unknown>
) {
  const sameAs = siteSocialSameAs();
  const base = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tread Trails",
    url: absoluteUrl("/"),
    email: siteContactEmail(),
    description:
      "Expedition-grade automotive upgrades — chassis tuning, armor, lighting, curated accessories, portfolio installs, and concierge studio fitting in India and the UAE.",
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/opengraph-image"),
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressCountry: "IN",
    },
    areaServed: ["IN", "AE"],
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
  if (!overrides || Object.keys(overrides).length === 0) return base;
  return { ...base, ...overrides, "@context": "https://schema.org" };
}

/** Google-supported SearchAction template → `/products?q={search_term_string}` */
export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tread Trails",
    url: absoluteUrl("/"),
    publisher: {
      "@type": "Organization",
      name: "Tread Trails",
      url: absoluteUrl("/"),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/products")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getProductJsonLd(
  product: Product,
  productUrl: string,
  schemaConfig?: {
    includeOffers?: boolean;
    availabilityInStock?: string;
    availabilityQuote?: string;
    descriptionMaxLength?: number;
  }
) {
  const maxLen = schemaConfig?.descriptionMaxLength ?? 5000;
  const images = product.images.filter(Boolean).slice(0, 12);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: excerptPlain(product.description, maxLen),
    sku: product.slug,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category,
  };

  if (images.length === 1) {
    node.image = images[0];
  } else if (images.length > 1) {
    node.image = images;
  }

  const includeOffers = schemaConfig?.includeOffers !== false;
  if (includeOffers) {
    if (product.price != null) {
      node.offers = {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: product.currency ?? "INR",
        price: String(product.price),
        availability:
          schemaConfig?.availabilityInStock ?? "https://schema.org/InStock",
      };
    } else {
      node.offers = {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: product.currency ?? "INR",
        availability:
          schemaConfig?.availabilityQuote ?? "https://schema.org/PreOrder",
        description: "Price on application — contact studio for quotation.",
      };
    }
  }

  return node;
}

export function getBrandJsonLd(
  entry: { name: string; slug: string; tagline?: string; logoSrc?: string },
  brandUrl: string,
  schemaConfig?: { includeLogo?: boolean }
) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: entry.name,
    url: brandUrl,
  };
  if (entry.tagline) node.description = entry.tagline;
  if (schemaConfig?.includeLogo !== false && entry.logoSrc) {
    node.logo = entry.logoSrc;
  }
  return node;
}

export function getBreadcrumbListJsonLd(items: BreadcrumbJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.item ? { item: crumb.item } : {}),
    })),
  };
}
