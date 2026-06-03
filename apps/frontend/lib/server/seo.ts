import { apiFetchJson } from "@/services/api/server";

export type SeoSettings = {
  siteName: string;
  titleTemplate: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  defaultRobots: string;
  canonicalBaseUrl: string;
  organizationSchema: Record<string, unknown>;
  productSchema: Record<string, unknown> & {
    enabled?: boolean;
    includeOffers?: boolean;
    availabilityInStock?: string;
    availabilityQuote?: string;
    descriptionMaxLength?: number;
  };
  brandSchema: Record<string, unknown> & {
    enabled?: boolean;
    includeLogo?: boolean;
  };
};

export type SeoRoute = {
  id: string;
  path: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  robots: string;
};

export type SeoBundle = {
  settings: SeoSettings;
  routes: SeoRoute[];
};

let cached: SeoBundle | null = null;

export async function getSeoBundle(): Promise<SeoBundle | null> {
  try {
    const data = await apiFetchJson<SeoBundle>("/api/seo", {
      revalidate: 120,
      tags: ["seo"],
    });
    cached = data;
    return data;
  } catch {
    return cached;
  }
}

export async function getRouteSeo(path: string) {
  const bundle = await getSeoBundle();
  if (!bundle) return null;

  const route = bundle.routes.find((r) => r.path === path);
  const s = bundle.settings;

  return {
    metaTitle: route?.metaTitle || "",
    metaDescription: route?.metaDescription || s.defaultMetaDescription,
    canonicalUrl: route?.canonicalUrl || "",
    ogImageUrl: route?.ogImageUrl || s.defaultOgImage,
    robots: route?.robots || s.defaultRobots,
    settings: s,
  };
}

export function parseRobotsDirective(robots: string): {
  index: boolean;
  follow: boolean;
} {
  const parts = robots.toLowerCase().split(",").map((p) => p.trim());
  return {
    index: !parts.includes("noindex"),
    follow: !parts.includes("nofollow"),
  };
}
