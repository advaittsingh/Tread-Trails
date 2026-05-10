import { NextResponse } from "next/server";

import {
  PORTFOLIO_PRODUCT_LINK_META,
  portfolioBuildPayload,
} from "@/lib/api/portfolio-payload";
import { listBuildsReferencingProduct } from "@/lib/server/portfolio-build-links";

type RouteCtx = { params: { productRef: string } };

/**
 * Reverse lookup: portfolio builds that reference this product (slug, legacy id, or DB id).
 */
export async function GET(_req: Request, context: RouteCtx) {
  const productRef = decodeURIComponent(context.params.productRef ?? "").trim();

  if (!productRef) {
    return NextResponse.json({ error: "productRef required" }, { status: 400 });
  }

  try {
    const { catalogToken, builds } =
      await listBuildsReferencingProduct(productRef);

    return NextResponse.json({
      meta: {
        productBuildRelation: PORTFOLIO_PRODUCT_LINK_META.model,
        resolvedCatalogToken: catalogToken,
      },
      builds: builds.map(portfolioBuildPayload),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to resolve portfolio links" },
      { status: 500 }
    );
  }
}
