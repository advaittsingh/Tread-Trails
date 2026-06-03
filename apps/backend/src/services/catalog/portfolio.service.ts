import type { Build, Product } from "@tread-trails/shared-types";

import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "../../lib/catalog/map-product.js";
import { prismaPortfolioBuildToBuild } from "../../lib/catalog/map-portfolio-build.js";
import { PORTFOLIO_PRODUCT_LINK_META } from "../../lib/api/portfolio-payload.js";
import { buildsService } from "./builds.service.js";
import { getProductsByTokens } from "./products.service.js";
import { prisma } from "../../lib/prisma.js";

export async function resolvePortfolioLinkedProducts(
  buildSlug: string,
  productIdsFallback: string[]
): Promise<Product[]> {
  try {
    const row = await prisma.portfolioBuild.findUnique({
      where: { slug: buildSlug },
      include: {
        linkedProducts: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { include: productWithVehicleCompatInclude },
          },
        },
      },
    });
    if (row?.linkedProducts.length) {
      return row.linkedProducts.map((l) => prismaProductToDTO(l.product));
    }
  } catch {
    /* ignore */
  }

  return getProductsByTokens(productIdsFallback);
}

export async function canonicalPortfolioProductToken(
  ref: string
): Promise<string | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  try {
    const row = await prisma.product.findFirst({
      where: {
        OR: [{ slug: trimmed }, { legacyId: trimmed }, { id: trimmed }],
      },
      select: { id: true, legacyId: true },
    });
    if (row) return row.legacyId ?? row.id;
  } catch {
    /* ignore */
  }

  const catalog = await getProductsByTokens([trimmed]);
  return catalog[0]?.id ?? null;
}

export async function listBuildsReferencingProduct(
  productRef: string
): Promise<{ catalogToken: string | null; builds: Build[] }> {
  const trimmed = productRef.trim();

  try {
    if (trimmed) {
      const prodRow = await prisma.product.findFirst({
        where: {
          OR: [{ slug: trimmed }, { legacyId: trimmed }, { id: trimmed }],
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
            builds: links.map((l) => prismaPortfolioBuildToBuild(l.portfolioBuild)),
          };
        }
      }
    }
  } catch {
    /* ignore */
  }

  const catalogToken = await canonicalPortfolioProductToken(productRef);
  if (!catalogToken) {
    return { catalogToken: null, builds: [] };
  }

  const builds = await buildsService.list();
  const matched = builds.filter((b) => b.productIds.includes(catalogToken));

  return { catalogToken, builds: matched };
}

export { PORTFOLIO_PRODUCT_LINK_META };
