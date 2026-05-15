import type { MetadataRoute } from "next";

import { products } from "@/data/index";
import { siteUrl } from "@/lib/site";
import { listBrandEntries } from "@/lib/server/brand-catalog";
import { listBuilds } from "@/lib/server/build-catalog";
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
  const cars = await listVehicles();
  const builds = await listBuilds();
  const hubBrands = await listBrandEntries();

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

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
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
