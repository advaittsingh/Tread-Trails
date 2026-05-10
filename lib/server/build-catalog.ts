import {
  builds as staticBuilds,
  getBuildBySlug as getStaticBuildBySlug,
  getBuildsForVehicle as getStaticBuildsForVehicle,
  listBuildSlugs as listStaticBuildSlugs,
} from "@/data/build";
import type { Build } from "@/data/types";
import { prismaPortfolioBuildToBuild } from "@/lib/catalog/map-portfolio-build";
import { prisma } from "@/lib/prisma";

/**
 * Featured portfolio builds for `/` — sourced from the same catalog as `listBuilds`
 * (`PortfolioBuild.homeSpotlightRank` when DB seeded; else `data/builds` ranks).
 * Lower rank first; unranked builds fill remaining slots by title.
 */
export async function listHomeFeaturedBuilds(limit = 3): Promise<Build[]> {
  const all = await listBuilds();
  const sorted = [...all].sort((a, b) => {
    const ra = a.homeSpotlightRank ?? Number.MAX_SAFE_INTEGER;
    const rb = b.homeSpotlightRank ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.title.localeCompare(b.title);
  });
  return sorted.slice(0, limit);
}

/** Portfolio builds from Neon when seeded; otherwise static `data/builds`. */
export async function listBuilds(): Promise<Build[]> {
  try {
    const rows = await prisma.portfolioBuild.findMany({
      orderBy: { title: "asc" },
    });
    if (rows.length > 0) return rows.map(prismaPortfolioBuildToBuild);
  } catch {
    /* DATABASE_URL missing / unreachable */
  }
  return staticBuilds;
}

export async function getBuildBySlug(slug: string): Promise<Build | null> {
  try {
    const row = await prisma.portfolioBuild.findUnique({ where: { slug } });
    if (row) return prismaPortfolioBuildToBuild(row);
  } catch {
    /* ignore */
  }
  return getStaticBuildBySlug(slug) ?? null;
}

export async function getBuildsForVehicle(vehicleSlug: string): Promise<Build[]> {
  try {
    const rows = await prisma.portfolioBuild.findMany({
      where: { vehicleSlug },
      orderBy: { title: "asc" },
    });
    if (rows.length > 0) return rows.map(prismaPortfolioBuildToBuild);
  } catch {
    /* ignore */
  }
  return getStaticBuildsForVehicle(vehicleSlug);
}

export async function listBuildSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.portfolioBuild.findMany({
      select: { slug: true },
      orderBy: { slug: "asc" },
    });
    if (rows.length > 0) return rows.map((r) => r.slug);
  } catch {
    /* ignore */
  }
  return listStaticBuildSlugs();
}
