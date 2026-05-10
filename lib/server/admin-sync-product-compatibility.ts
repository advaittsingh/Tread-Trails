import { prisma } from "@/lib/prisma";

/** Subset of Prisma client used for compat writes (supports `$transaction` delegates). */
export type ProductVehicleCompatDb = Pick<
  typeof prisma,
  "productVehicleCompatibility" | "vehicle"
>;

export class UnknownVehicleSlugError extends Error {
  constructor(readonly missingSlugs: string[]) {
    super(`Unknown vehicle slug(s): ${missingSlugs.join(", ")}`);
    this.name = "UnknownVehicleSlugError";
  }
}

/** Replace `ProductVehicleCompatibility` rows for a product from explicit vehicle slugs. */
export async function replaceProductVehicleCompatibilityBySlug(
  productId: string,
  vehicleSlugs: string[],
  db: ProductVehicleCompatDb = prisma
): Promise<void> {
  await db.productVehicleCompatibility.deleteMany({ where: { productId } });

  const uniq = Array.from(new Set(vehicleSlugs)).filter(Boolean);
  if (uniq.length === 0) return;

  const vehicles = await db.vehicle.findMany({
    where: { slug: { in: uniq } },
    select: { id: true, slug: true },
  });
  const found = new Set(vehicles.map((v) => v.slug));
  const missing = uniq.filter((s) => !found.has(s));
  if (missing.length > 0) {
    throw new UnknownVehicleSlugError(missing);
  }

  await db.productVehicleCompatibility.createMany({
    data: vehicles.map((v) => ({
      productId,
      vehicleId: v.id,
    })),
    skipDuplicates: true,
  });
}
