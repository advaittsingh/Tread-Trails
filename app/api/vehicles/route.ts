import { NextResponse } from "next/server";

import { cars as staticCars } from "@/data/cars";
import { mapVehicleRowToCar } from "@/lib/catalog/vehicle-hierarchy";
import { prisma } from "@/lib/prisma";

const vehicleSelect = {
  id: true,
  legacyId: true,
  slug: true,
  name: true,
  tagline: true,
  description: true,
  heroImage: true,
  thumbnail: true,
  category: true,
  engineSummary: true,
  modelYearsLabel: true,
  trimSummary: true,
  generationKey: true,
  model: {
    select: {
      slug: true,
      name: true,
      make: { select: { slug: true, name: true } },
    },
  },
} as const;

function staticToVehiclePayload(c: (typeof staticCars)[number]) {
  return { ...c };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();

  try {
    if (slug) {
      const v = await prisma.vehicle.findUnique({
        where: { slug },
        select: vehicleSelect,
      });
      if (v) {
        return NextResponse.json({ vehicle: mapVehicleRowToCar(v) });
      }
      const fallback = staticCars.find((c) => c.slug === slug);
      if (fallback) {
        return NextResponse.json({ vehicle: staticToVehiclePayload(fallback) });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const vehicles = await prisma.vehicle.findMany({
      select: vehicleSelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    if (vehicles.length > 0) {
      return NextResponse.json({
        vehicles: vehicles.map(mapVehicleRowToCar),
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
