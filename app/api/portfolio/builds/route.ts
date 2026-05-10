import { NextResponse } from "next/server";

import {
  PORTFOLIO_PRODUCT_LINK_META,
  portfolioBuildPayload,
} from "@/lib/api/portfolio-payload";
import { getBuildsForVehicle, listBuilds } from "@/lib/server/build-catalog";

/**
 * Portfolio builds list (`PortfolioBuild`). Products appear via embedded `productIds`
 * — see `meta.productBuildRelation` (no dedicated join table).
 *
 * Query: `vehicleSlug` — filter by vehicle platform.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vehicleSlug = searchParams.get("vehicleSlug")?.trim();

  try {
    const builds = vehicleSlug
      ? await getBuildsForVehicle(vehicleSlug)
      : await listBuilds();

    return NextResponse.json({
      meta: { productBuildRelation: PORTFOLIO_PRODUCT_LINK_META.model },
      builds: builds.map(portfolioBuildPayload),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load portfolio builds" },
      { status: 500 }
    );
  }
}
