import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";

/** Catalog sourced from MongoDB (seed from static data). Static pages may still use `data/products`. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  try {
    await connectDB();
    if (slug) {
      const p = await Product.findOne({ slug }).lean();
      if (!p) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        product: {
          id: p.legacyId ?? p._id.toString(),
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price ?? undefined,
          currency: p.currency,
          images: p.images,
          description: p.description,
          specs: p.specs,
          variants: p.variants,
          compatibleCars: p.compatibleCars,
        },
      });
    }

    const products = await Product.find().sort({ name: 1 }).lean();
    return NextResponse.json({
      products: products.map((p) => ({
        id: p.legacyId ?? p._id.toString(),
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price ?? undefined,
        currency: p.currency,
        images: p.images,
        description: p.description,
        specs: p.specs,
        variants: p.variants,
        compatibleCars: p.compatibleCars,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
