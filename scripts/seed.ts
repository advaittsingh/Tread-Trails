/**
 * Seed MongoDB with catalog products (from static data) and optional admin user.
 *
 * Usage:
 *   npm run seed
 *
 * Loads .env.local / .env when dotenv is available—ensure MONGODB_URI (+optional SEED_ADMIN_*).
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { hashPassword } from "../lib/auth/password";
import { connectDB } from "../lib/db";
import { Product } from "../lib/models/Product";
import { User } from "../lib/models/User";
import { products as staticProducts } from "../data/products";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  await connectDB();

  let upserted = 0;
  for (const p of staticProducts) {
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        legacyId: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price ?? undefined,
        currency: p.currency ?? "INR",
        images: p.images,
        description: p.description,
        specs: p.specs,
        variants: p.variants?.map((v) => ({
          id: v.id,
          label: v.label,
          priceModifier: v.priceModifier,
        })),
        compatibleCars: p.compatibleCars,
      },
      { upsert: true, new: true }
    );
    upserted++;
  }
  console.info(`Products upserted: ${upserted}`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || "Admin";

  if (adminEmail && adminPassword) {
    const passwordHash = await hashPassword(adminPassword);
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: "admin",
      },
      { upsert: true, new: true }
    );
    console.info(`Admin user ensured: ${adminEmail}`);
  } else {
    console.info("Skip admin seed (set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD)");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
