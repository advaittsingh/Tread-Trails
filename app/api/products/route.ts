import { NextResponse } from "next/server";

import {
  getProductBySlug,
  listProducts,
  listProductsForVehicleSlug,
} from "@/lib/server/product-catalog";

/**
 * Product catalog (Neon). Vehicle filtering uses the same join-backed DTOs as storefront pages.
 * Full list: DB when rows exist; otherwise sorted static `data/products` fallback.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  const vehicleSlug = searchParams.get("vehicleSlug")?.trim();

  try {
    if (slug) {
      const product = await getProductBySlug(slug);
      if (!product) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    if (vehicleSlug) {
      const products = await listProductsForVehicleSlug(vehicleSlug);
      return NextResponse.json({ products });
    }

    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (e) {
    console.error(e);
    if (!slug && !vehicleSlug) {
      try {
        const products = await listProducts();
        return NextResponse.json({ products });
      } catch {
        return NextResponse.json(
          { error: "Failed to load products" },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
