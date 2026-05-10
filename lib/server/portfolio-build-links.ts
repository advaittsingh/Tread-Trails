import type { Build } from "@/data/types";

import { prismaPortfolioBuildToBuild } from "@/lib/catalog/map-portfolio-build";
import { prisma } from "@/lib/prisma";
import { canonicalPortfolioProductToken } from "@/lib/server/portfolio-products";
import { listBuilds } from "@/lib/server/build-catalog";

/** Builds linked via `PortfolioBuildProduct`, else array scan on `productIds`. */
export async function listBuildsReferencingProduct(
  productRef: string
): Promise<{ catalogToken: string | null; builds: Build[] }> {
  const trimmed = productRef.trim();

  try {
    if (trimmed) {
      const prodRow = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: trimmed },
            { legacyId: trimmed },
            { id: trimmed },
          ],
        },
        select: { id: true, legacyId: true },
      });

      if (prodRow) {
        const links = await prisma.portfolioBuildProduct.findMany({
          where: { productId: prodRow.id },
          include: { portfolioBuild: true },
        });
        if (links.length > 0) {
          return {
            catalogToken: prodRow.legacyId ?? prodRow.id,
            builds: links.map((l) =>
              prismaPortfolioBuildToBuild(l.portfolioBuild)
            ),
          };
        }
      }
    }
  } catch {
    /* DATABASE_URL missing */
  }

  const catalogToken = await canonicalPortfolioProductToken(productRef);
  if (!catalogToken) {
    return { catalogToken: null, builds: [] };
  }

  const builds = await listBuilds();
  const matched = builds.filter((b) => b.productIds.includes(catalogToken));

  return { catalogToken, builds: matched };
}
