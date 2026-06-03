import { prisma } from "../../lib/prisma.js";
import {
  DEFAULT_BRAND_SCHEMA,
  DEFAULT_ORGANIZATION_SCHEMA,
  DEFAULT_PRODUCT_SCHEMA,
  DEFAULT_SEO_ROUTES,
} from "../../lib/validators/admin-seo.js";

export async function ensureSeoSettings() {
  return prisma.seoSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      organizationSchema: DEFAULT_ORGANIZATION_SCHEMA,
      productSchema: DEFAULT_PRODUCT_SCHEMA,
      brandSchema: DEFAULT_BRAND_SCHEMA,
    },
    update: {},
  });
}

export async function ensureSeoRoutes() {
  for (const route of DEFAULT_SEO_ROUTES) {
    await prisma.seoRoute.upsert({
      where: { path: route.path },
      create: { path: route.path, label: route.label },
      update: {},
    });
  }
}

export function mapSeoSettings(row: {
  siteName: string;
  titleTemplate: string;
  defaultMetaDescription: string;
  defaultOgImage: string;
  defaultRobots: string;
  canonicalBaseUrl: string;
  organizationSchema: unknown;
  productSchema: unknown;
  brandSchema: unknown;
  updatedAt: Date;
}) {
  return {
    siteName: row.siteName,
    titleTemplate: row.titleTemplate,
    defaultMetaDescription: row.defaultMetaDescription,
    defaultOgImage: row.defaultOgImage,
    defaultRobots: row.defaultRobots,
    canonicalBaseUrl: row.canonicalBaseUrl,
    organizationSchema: mergeJson(DEFAULT_ORGANIZATION_SCHEMA, row.organizationSchema),
    productSchema: mergeJson(DEFAULT_PRODUCT_SCHEMA, row.productSchema),
    brandSchema: mergeJson(DEFAULT_BRAND_SCHEMA, row.brandSchema),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapSeoRoute(row: {
  id: string;
  path: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  robots: string;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    path: row.path,
    label: row.label,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    canonicalUrl: row.canonicalUrl,
    ogImageUrl: row.ogImageUrl,
    robots: row.robots,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mergeJson(
  defaults: Record<string, unknown>,
  stored: unknown
): Record<string, unknown> {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return defaults;
  }
  return { ...defaults, ...(stored as Record<string, unknown>) };
}

export async function getPublicSeoBundle() {
  const [settings, routes] = await Promise.all([
    ensureSeoSettings(),
    prisma.seoRoute.findMany({ orderBy: { path: "asc" } }),
  ]);
  await ensureSeoRoutes();
  const allRoutes = await prisma.seoRoute.findMany({ orderBy: { path: "asc" } });

  return {
    settings: mapSeoSettings(settings),
    routes: allRoutes.map(mapSeoRoute),
  };
}

export function resolveRouteSeo(
  path: string,
  routes: ReturnType<typeof mapSeoRoute>[],
  settings: ReturnType<typeof mapSeoSettings>
) {
  const route = routes.find((r) => r.path === path);
  return {
    metaTitle: route?.metaTitle || "",
    metaDescription: route?.metaDescription || settings.defaultMetaDescription,
    canonicalUrl: route?.canonicalUrl || "",
    ogImageUrl: route?.ogImageUrl || settings.defaultOgImage,
    robots: route?.robots || settings.defaultRobots,
  };
}
