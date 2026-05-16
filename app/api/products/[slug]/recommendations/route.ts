import { NextResponse } from "next/server";

import { buildRecommendationsPayload } from "@/lib/recommendations/build-payload";
import { getProductBySlug } from "@/lib/server/product-catalog";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const payload = await buildRecommendationsPayload(slug);
    return NextResponse.json({ source: "api" as const, ...payload });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Recommendations unavailable" },
      { status: 503 }
    );
  }
}
