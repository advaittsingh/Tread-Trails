import type { Vehicle } from "@prisma/client";

import type { Car } from "@/data/types";

export function prismaVehicleToCar(v: Vehicle): Car {
  return {
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
  };
}
