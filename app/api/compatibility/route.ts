import { NextResponse } from "next/server";

import { listProductsForVehicleSlug } from "@/lib/server/vehicle-catalog";

/**
 * Dedicated compatibility listing: products tied to a vehicle platform.
 *
 * Uses the same rules as `/vehicle/[slug]` parts tab and `GET /api/products?vehicleSlug=`:
 * Postgres `ProductVehicleCompatibility` when populated; otherwise explicit static edges in
 * `data/product-vehicle-compatibility-edges.ts` (derived onto catalog `Product.compatibleCars`).
 *
 * `GET /api/compatibility?vehicleSlug=toyota-hilux` → `{ vehicleSlug, products }`
 */
export async function GET(req: Request) {
  const vehicleSlug = new URL(req.url).searchParams.get("vehicleSlug")?.trim();

  if (!vehicleSlug) {
    return NextResponse.json(
      { error: "Missing vehicleSlug query parameter" },
      { status: 400 }
    );
  }

  try {
    const products = await listProductsForVehicleSlug(vehicleSlug);
    return NextResponse.json({
      vehicleSlug,
      count: products.length,
      products,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load compatible products" },
      { status: 500 }
    );
  }
}
