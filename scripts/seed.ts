/**
 * Seed Postgres (Neon): vehicles, brands, portfolio builds, catalog products (static data), optional admin.
 *
 * Usage:
 *   npm run seed
 *
 * Loads .env.local / .env when dotenv is available—ensure DATABASE_URL (+optional SEED_ADMIN_*).
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import {
  ADVVEN_PARTNER_BRANDS,
  productBelongsToPartnerSlug,
} from "../data/advven-brands";
import { builds as staticBuilds } from "../data/build";
import { cars as staticCars } from "../data/cars";
import { products as staticProducts } from "../data/products";
import { hashPassword } from "../lib/auth/password";
import { prisma } from "../lib/prisma";
import { getVehicleSlugsForProductSlug } from "../lib/compatibility/product-vehicle-map";
import { recountBrandProductCountsFromDb } from "../lib/server/brand-catalog";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  let vehiclesUpserted = 0;
  for (const c of staticCars) {
    await prisma.vehicle.upsert({
      where: { slug: c.slug },
      create: {
        legacyId: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        heroImage: c.heroImage,
        thumbnail: c.thumbnail,
        category: c.category,
        engineSummary: c.engineSummary,
        modelYearsLabel: c.modelYearsLabel,
        trimSummary: c.trimSummary,
      },
      update: {
        legacyId: c.id,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        heroImage: c.heroImage,
        thumbnail: c.thumbnail,
        category: c.category,
        engineSummary: c.engineSummary,
        modelYearsLabel: c.modelYearsLabel,
        trimSummary: c.trimSummary,
      },
    });
    vehiclesUpserted++;
  }
  console.info(`Vehicles upserted: ${vehiclesUpserted}`);

  let upserted = 0;
  for (const p of staticProducts) {
    const prod = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        legacyId: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price ?? null,
        currency: p.currency ?? "INR",
        images: p.images,
        description: p.description ?? "",
        specs: (p.specs ?? []) as any,
        variants: (p.variants ?? []).map((v) => ({
          id: v.id,
          label: v.label,
          priceModifier: v.priceModifier,
        })) as any,
      },
      update: {
        legacyId: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price ?? null,
        currency: p.currency ?? "INR",
        images: p.images,
        description: p.description ?? "",
        specs: (p.specs ?? []) as any,
        variants: (p.variants ?? []).map((v) => ({
          id: v.id,
          label: v.label,
          priceModifier: v.priceModifier,
        })) as any,
      },
    });

    await prisma.productVehicleCompatibility.deleteMany({
      where: { productId: prod.id },
    });
    const compatSlugs = getVehicleSlugsForProductSlug(prod.slug);
    if (compatSlugs.length > 0) {
      const vehicles = await prisma.vehicle.findMany({
        where: { slug: { in: compatSlugs } },
        select: { id: true },
      });
      await prisma.productVehicleCompatibility.createMany({
        data: vehicles.map((v) => ({
          productId: prod.id,
          vehicleId: v.id,
        })),
        skipDuplicates: true,
      });
    }

    upserted++;
  }
  console.info(`Products upserted: ${upserted}`);

  let buildsUpserted = 0;
  for (const b of staticBuilds) {
    await prisma.portfolioBuild.upsert({
      where: { slug: b.slug },
      create: {
        legacyId: b.id,
        slug: b.slug,
        title: b.title,
        vehicleSlug: b.vehicleSlug,
        summary: b.summary,
        description: b.description,
        beforeImage: b.beforeImage,
        afterImage: b.afterImage,
        gallery: b.gallery,
        productIds: b.productIds,
        homeSpotlightRank: b.homeSpotlightRank ?? null,
      },
      update: {
        legacyId: b.id,
        title: b.title,
        vehicleSlug: b.vehicleSlug,
        summary: b.summary,
        description: b.description,
        beforeImage: b.beforeImage,
        afterImage: b.afterImage,
        gallery: b.gallery,
        productIds: b.productIds,
        homeSpotlightRank: b.homeSpotlightRank ?? null,
      },
    });

    const pb = await prisma.portfolioBuild.findUnique({
      where: { slug: b.slug },
      select: { id: true },
    });
    if (pb) {
      await prisma.portfolioBuildProduct.deleteMany({
        where: { portfolioBuildId: pb.id },
      });
      let sortOrder = 0;
      for (const token of b.productIds) {
        const prod = await prisma.product.findFirst({
          where: { OR: [{ legacyId: token }, { id: token }] },
          select: { id: true },
        });
        if (!prod) continue;
        await prisma.portfolioBuildProduct.create({
          data: {
            portfolioBuildId: pb.id,
            productId: prod.id,
            sortOrder: sortOrder++,
          },
        });
      }
    }

    buildsUpserted++;
  }
  console.info(`Portfolio builds upserted: ${buildsUpserted}`);

  let brandsUpserted = 0;
  for (let i = 0; i < ADVVEN_PARTNER_BRANDS.length; i++) {
    const b = ADVVEN_PARTNER_BRANDS[i];
    const productCount = staticProducts.filter((p) =>
      productBelongsToPartnerSlug(p, b.slug)
    ).length;
    await prisma.brand.upsert({
      where: { slug: b.slug },
      create: {
        slug: b.slug,
        name: b.name,
        tagline: b.tagline,
        logoSrc: b.logoSrc,
        sortOrder: i,
        productCount,
      },
      update: {
        name: b.name,
        tagline: b.tagline,
        logoSrc: b.logoSrc,
        sortOrder: i,
        productCount,
      },
    });
    brandsUpserted++;
  }
  console.info(`Brands upserted: ${brandsUpserted}`);
  await recountBrandProductCountsFromDb();

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || "Admin";

  if (adminEmail && adminPassword) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: "admin",
      },
      update: {
        passwordHash,
        name: adminName,
        role: "admin",
      },
    });
    console.info(`Admin user ensured: ${adminEmail}`);
  } else {
    console.info("Skip admin seed (set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD)");
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
