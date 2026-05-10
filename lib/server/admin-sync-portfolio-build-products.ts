import {
  UnknownVehicleSlugError,
} from "@/lib/server/admin-sync-product-compatibility";
import { prisma } from "@/lib/prisma";

export class UnknownPortfolioProductRefError extends Error {
  constructor(readonly missingRefs: string[]) {
    super(`Unknown product ref(s): ${missingRefs.join(", ")}`);
    this.name = "UnknownPortfolioProductRefError";
  }
}

type PortfolioLinkDb = Pick<
  typeof prisma,
  "portfolioBuildProduct" | "portfolioBuild" | "product"
>;

/** Ensures `Vehicle.slug` exists in Neon. */
export async function assertPortfolioBuildVehicleSlug(
  vehicleSlug: string,
  db: Pick<typeof prisma, "vehicle">
): Promise<void> {
  const v = await db.vehicle.findUnique({
    where: { slug: vehicleSlug },
    select: { id: true },
  });
  if (!v) throw new UnknownVehicleSlugError([vehicleSlug]);
}

/**
 * Replaces `PortfolioBuildProduct` rows and mirrors canonical tokens into `PortfolioBuild.productIds`
 * (`legacyId ?? id` per product, deduped, order preserved).
 */
export async function replacePortfolioBuildProductLinks(
  portfolioBuildId: string,
  orderedRawRefs: string[],
  db: PortfolioLinkDb
): Promise<void> {
  const refs = orderedRawRefs.map((r) => r.trim()).filter(Boolean);

  await db.portfolioBuildProduct.deleteMany({
    where: { portfolioBuildId },
  });

  if (refs.length === 0) {
    await db.portfolioBuild.update({
      where: { id: portfolioBuildId },
      data: { productIds: [] },
    });
    return;
  }

  type Resolved = {
    id: string;
    legacyId: string | null;
    slug: string;
  };

  const resolved: Resolved[] = [];
  const seenProductIds = new Set<string>();
  const missing: string[] = [];

  for (const token of refs) {
    const row = await db.product.findFirst({
      where: {
        OR: [{ slug: token }, { legacyId: token }, { id: token }],
      },
      select: { id: true, legacyId: true, slug: true },
    });
    if (!row) {
      missing.push(token);
      continue;
    }
    if (seenProductIds.has(row.id)) continue;
    seenProductIds.add(row.id);
    resolved.push(row);
  }

  if (missing.length > 0) {
    throw new UnknownPortfolioProductRefError(missing);
  }

  if (resolved.length > 0) {
    await db.portfolioBuildProduct.createMany({
      data: resolved.map((p, i) => ({
        portfolioBuildId,
        productId: p.id,
        sortOrder: i,
      })),
      skipDuplicates: true,
    });
  }

  await db.portfolioBuild.update({
    where: { id: portfolioBuildId },
    data: {
      productIds: resolved.map((p) => p.legacyId ?? p.id),
    },
  });
}
