import { NextResponse } from "next/server";

import { getProductBySlug } from "@/data/index";
import { products as staticProducts } from "@/data/products";
import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "@/lib/catalog/map-product";
import { prisma } from "@/lib/prisma";
import { listProductsForVehicleSlug } from "@/lib/server/vehicle-catalog";

function staticCatalogSorted() {
  return [...staticProducts].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Product catalog (Neon). Vehicle filtering uses `@/lib/server/vehicle-catalog`
 * (join table + static fallback) — same as `GET /api/compatibility?vehicleSlug=`.
 * Full list (`GET /api/products`): DB when rows exist; otherwise sorted static `data/products`.
 * Vehicle filters use `ProductVehicleCompatibility` or explicit `product-vehicle-compatibility-edges.ts`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  const vehicleSlug = searchParams.get("vehicleSlug")?.trim();

  try {
    if (slug) {
      const p = await prisma.product.findUnique({
        where: { slug },
        include: productWithVehicleCompatInclude,
      });
      if (p) {
        return NextResponse.json({ product: prismaProductToDTO(p) });
      }
      const fallback = getProductBySlug(slug);
      if (fallback) {
        return NextResponse.json({ product: fallback });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (vehicleSlug) {
      const products = await listProductsForVehicleSlug(vehicleSlug);
      return NextResponse.json({ products });
    }

    try {
      const rows = await prisma.product.findMany({
        include: productWithVehicleCompatInclude,
        orderBy: { name: "asc" },
      });
      if (rows.length > 0) {
        return NextResponse.json({
          products: rows.map(prismaProductToDTO),
        });
      }
    } catch {
      /* DATABASE_URL missing / unreachable */
    }

    return NextResponse.json({ products: staticCatalogSorted() });
  } catch (e) {
    console.error(e);
    if (!slug && !vehicleSlug) {
      return NextResponse.json({ products: staticCatalogSorted() });
    }
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
