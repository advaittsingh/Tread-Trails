import { NextResponse } from "next/server";

import {
  PORTFOLIO_PRODUCT_LINK_META,
  portfolioBuildPayload,
} from "@/lib/api/portfolio-payload";
import { resolvePortfolioLinkedProducts } from "@/lib/server/portfolio-products";
import { getBuildBySlug } from "@/lib/server/build-catalog";

type RouteCtx = { params: { slug: string } };

/**
 * Single portfolio build. `?expand=products` resolves `productIds` through Neon + static catalog.
 */
export async function GET(req: Request, context: RouteCtx) {
  const slug = context.params.slug.trim();
  const expand = new URL(req.url).searchParams.get("expand")?.trim();

  try {
    const build = await getBuildBySlug(slug);
    if (!build) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const base = {
      meta: { productBuildRelation: PORTFOLIO_PRODUCT_LINK_META.model },
      build: portfolioBuildPayload(build),
    };

    if (expand === "products") {
      const products = await resolvePortfolioLinkedProducts(
        build.slug,
        build.productIds
      );
      return NextResponse.json({
        ...base,
        products,
      });
    }

    return NextResponse.json(base);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load portfolio build" },
      { status: 500 }
    );
  }
}
