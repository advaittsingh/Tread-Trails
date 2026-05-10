import { NextResponse } from "next/server";

import type { BrandEntry } from "@/data/index";
import { prismaBrandToBrandEntry } from "@/lib/catalog/map-brand";
import { getBrandBySlug, listBrandEntries } from "@/lib/server/brand-catalog";
import { prisma } from "@/lib/prisma";

function brandToPayload(b: BrandEntry) {
  return {
    name: b.name,
    slug: b.slug,
    productCount: b.productCount,
    ...(b.tagline != null ? { tagline: b.tagline } : {}),
    ...(b.logoSrc != null ? { logoSrc: b.logoSrc } : {}),
  };
}

/**
 * Hub partner brands (Neon when seeded; falls back to static Advven lineup).
 *
 * - `GET /api/brands` — `{ brands: [...] }`
 * - `GET /api/brands?slug=method` — `{ brand: {...} }` or 404
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();

  try {
    if (slug) {
      const row = await prisma.brand.findUnique({ where: { slug } });
      if (row) {
        return NextResponse.json({
          brand: brandToPayload(prismaBrandToBrandEntry(row)),
        });
      }
      const fallback = await getBrandBySlug(slug);
      if (fallback) {
        return NextResponse.json({ brand: brandToPayload(fallback) });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await prisma.brand.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    if (rows.length > 0) {
      return NextResponse.json({
        brands: rows.map((r) => brandToPayload(prismaBrandToBrandEntry(r))),
      });
    }

    const brands = await listBrandEntries();
    return NextResponse.json({
      brands: brands.map(brandToPayload),
    });
  } catch (e) {
    console.error(e);
    if (slug) {
      const fallback = await getBrandBySlug(slug);
      if (fallback) {
        return NextResponse.json({ brand: brandToPayload(fallback) });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const brands = await listBrandEntries();
    return NextResponse.json({
      brands: brands.map(brandToPayload),
    });
  }
}
