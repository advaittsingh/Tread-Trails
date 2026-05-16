import { prisma } from "@/lib/prisma";

function titleCase(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Parse slug like `toyota-fortuner-gen1` → make, model, generation. */
export function parseVehicleSlug(slug: string): {
  makeSlug: string;
  modelSlug: string;
  generationKey: string | null;
} | null {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length < 2) return null;
  const makeSlug = parts[0]!;
  const last = parts[parts.length - 1]!;
  const hasGen = /^gen\d+$/i.test(last) || /^\d+-series$/i.test(last);
  if (hasGen && parts.length >= 3) {
    return {
      makeSlug,
      modelSlug: parts.slice(1, -1).join("-"),
      generationKey: last.toLowerCase(),
    };
  }
  return {
    makeSlug,
    modelSlug: parts.slice(1).join("-"),
    generationKey: null,
  };
}

/** Idempotent backfill of VehicleMake / VehicleModel from existing Vehicle slugs. */
export async function backfillVehicleHierarchyFromSlugs(): Promise<{
  makes: number;
  models: number;
  linked: number;
}> {
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, slug: true, modelId: true, generationKey: true },
  });

  let makes = 0;
  let models = 0;
  let linked = 0;

  for (const v of vehicles) {
    const parsed = parseVehicleSlug(v.slug);
    if (!parsed) continue;

    const make = await prisma.vehicleMake.upsert({
      where: { slug: parsed.makeSlug },
      create: { slug: parsed.makeSlug, name: titleCase(parsed.makeSlug) },
      update: {},
    });
    if (make.createdAt.getTime() === make.updatedAt.getTime()) makes++;

    const model = await prisma.vehicleModel.upsert({
      where: { makeId_slug: { makeId: make.id, slug: parsed.modelSlug } },
      create: {
        makeId: make.id,
        slug: parsed.modelSlug,
        name: titleCase(parsed.modelSlug),
      },
      update: {},
    });
    if (model.createdAt.getTime() === model.updatedAt.getTime()) models++;

    if (!v.modelId || v.generationKey !== parsed.generationKey) {
      await prisma.vehicle.update({
        where: { id: v.id },
        data: {
          modelId: model.id,
          generationKey: parsed.generationKey,
        },
      });
      linked++;
    }
  }

  return { makes, models, linked };
}
