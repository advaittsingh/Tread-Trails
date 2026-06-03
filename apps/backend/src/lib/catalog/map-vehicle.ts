import type { Car } from "@tread-trails/shared-types";

export const vehicleListSelect = {
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

export type VehicleListRow = {
  id: string;
  legacyId: string | null;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  thumbnail: string;
  category: string;
  engineSummary: string;
  modelYearsLabel: string;
  trimSummary: string;
  generationKey?: string | null;
  model?: {
    slug: string;
    name: string;
    make: { slug: string; name: string };
  } | null;
};

export function mapVehicleRowToCar(row: VehicleListRow): Car {
  return {
    id: row.legacyId ?? row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    heroImage: row.heroImage,
    thumbnail: row.thumbnail,
    category: row.category,
    engineSummary: row.engineSummary,
    modelYearsLabel: row.modelYearsLabel,
    trimSummary: row.trimSummary,
    makeSlug: row.model?.make.slug,
    makeName: row.model?.make.name,
    modelSlug: row.model?.slug,
    modelName: row.model?.name,
    generationKey: row.generationKey ?? undefined,
  };
}
