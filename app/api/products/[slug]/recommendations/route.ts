import { NextResponse } from "next/server";

import { getProductBySlug } from "@/data/index";
import { buildRecommendationsPayload } from "@/lib/recommendations/build-payload";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!getProductBySlug(slug)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const payload = buildRecommendationsPayload(slug);
    return NextResponse.json({ source: "api" as const, ...payload });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Recommendations unavailable" },
      { status: 503 }
    );
  }
}
