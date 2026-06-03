import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";
import { listBrandEntries } from "@/lib/server/brand-catalog";
import { listBuilds } from "@/lib/server/build-catalog";
import { listProductSlugs } from "@/lib/server/product-catalog";
import { listVehicles } from "@/lib/server/vehicle-catalog";

const STATIC = [
  "",
  "/vehicles",
  "/brands",
  "/products",
  "/builds",
  "/booking",
  "/about",
  "/youtube",
  "/corporate-inquiry",
  "/contact",
  "/cart",
  "/checkout",
  "/compare",
  "/account",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/checkout/success",
  "/checkout/canceled",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/$/, "");
  const lastModified = new Date();
  const [cars, builds, hubBrands, productSlugs] = await Promise.all([
    listVehicles(),
    listBuilds(),
    listBrandEntries(),
    listProductSlugs(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const vehicleEntries: MetadataRoute.Sitemap = cars.map((c) => ({
    url: `${base}/vehicle/${c.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const buildsByVehicleEntries: MetadataRoute.Sitemap = cars.map((c) => ({
    url: `${base}/builds/${c.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.72,
  }));

  const brandEntries: MetadataRoute.Sitemap = hubBrands.map((b) => ({
    url: `${base}/brands/${b.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.78,
  }));

  const productEntries: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${base}/product/${slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const buildEntries: MetadataRoute.Sitemap = builds.map((b) => ({
    url: `${base}/build/${b.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [
    ...staticEntries,
    ...vehicleEntries,
    ...buildsByVehicleEntries,
    ...brandEntries,
    ...productEntries,
    ...buildEntries,
  ];
}
