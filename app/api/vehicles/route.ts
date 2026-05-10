import { NextResponse } from "next/server";

import { cars as staticCars } from "@/data/cars";
import { prisma } from "@/lib/prisma";

function staticToVehiclePayload(c: (typeof staticCars)[number]) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    heroImage: c.heroImage,
    thumbnail: c.thumbnail,
    category: c.category,
    engineSummary: c.engineSummary,
    modelYearsLabel: c.modelYearsLabel,
    trimSummary: c.trimSummary,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();

  try {
    if (slug) {
      const v = await prisma.vehicle.findUnique({ where: { slug } });
      if (v) {
        return NextResponse.json({
          vehicle: {
            id: v.legacyId ?? v.id,
            slug: v.slug,
            name: v.name,
            tagline: v.tagline,
            description: v.description,
            heroImage: v.heroImage,
            thumbnail: v.thumbnail,
            category: v.category,
            engineSummary: v.engineSummary,
            modelYearsLabel: v.modelYearsLabel,
            trimSummary: v.trimSummary,
          },
        });
      }
      const fallback = staticCars.find((c) => c.slug === slug);
      if (fallback) {
        return NextResponse.json({ vehicle: staticToVehiclePayload(fallback) });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { name: "asc" },
    });

    if (vehicles.length > 0) {
      return NextResponse.json({
        vehicles: vehicles.map((v) => ({
          id: v.legacyId ?? v.id,
          slug: v.slug,
          name: v.name,
          tagline: v.tagline,
          description: v.description,
          heroImage: v.heroImage,
          thumbnail: v.thumbnail,
          category: v.category,
          engineSummary: v.engineSummary,
          modelYearsLabel: v.modelYearsLabel,
          trimSummary: v.trimSummary,
        })),
      });
    }

    return NextResponse.json({
      vehicles: staticCars.map(staticToVehiclePayload),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 });
  }
}
