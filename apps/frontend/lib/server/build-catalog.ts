import {
  builds as staticBuilds,
  getBuildBySlug as getStaticBuildBySlug,
  getBuildsForVehicle as getStaticBuildsForVehicle,
  listBuildSlugs as listStaticBuildSlugs,
} from "@/data/build";
import type { Build } from "@/data/types";
import { apiFetchJson } from "@/services/api/server";

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
    const data = await apiFetchJson<{ builds?: Build[] }>("/api/builds", {
      revalidate: 60,
      tags: ["builds"],
    });
    const list = data.builds ?? [];
    if (list.length > 0) return list;
  } catch {}
  return staticBuilds;
}

export async function getBuildBySlug(slug: string): Promise<Build | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  try {
    const data = await apiFetchJson<{ build?: Build }>(
      `/api/builds?slug=${encodeURIComponent(trimmed)}`,
      { revalidate: 60, tags: ["builds"] }
    );
    return data.build ?? null;
  } catch {}
  return getStaticBuildBySlug(slug) ?? null;
}

export async function getBuildsForVehicle(vehicleSlug: string): Promise<Build[]> {
  const slug = vehicleSlug.trim();
  if (slug) {
    try {
      const data = await apiFetchJson<{ builds?: Build[] }>(
        `/api/builds?vehicleSlug=${encodeURIComponent(slug)}`,
        { revalidate: 60, tags: ["builds"] }
      );
      const list = data.builds ?? [];
      if (list.length > 0) return list;
    } catch {}
  }
  return getStaticBuildsForVehicle(vehicleSlug);
}

export async function listBuildSlugs(): Promise<string[]> {
  try {
    const data = await apiFetchJson<{ builds?: Build[] }>("/api/builds", {
      revalidate: 300,
      tags: ["builds"],
    });
    const list = data.builds ?? [];
    if (list.length > 0) return list.map((b) => b.slug).filter(Boolean);
  } catch {}
  return listStaticBuildSlugs();
}
