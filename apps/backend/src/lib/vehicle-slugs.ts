import { prisma } from "./prisma.js";
import { loadStaticCars } from "./static-data.js";

export async function isKnownVehicleCatalogSlug(slug: string): Promise<boolean> {
  const trimmed = slug.trim();
  if (!trimmed) return false;

  try {
    const row = await prisma.vehicle.findUnique({
      where: { slug: trimmed },
      select: { id: true },
    });
    if (row) return true;
  } catch {
    /* ignore */
  }

  const staticCars = await loadStaticCars();
  return staticCars.some((c) => c.slug === trimmed);
}
