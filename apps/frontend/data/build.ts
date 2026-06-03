import { builds as buildRecords } from "./builds";
import type { Build } from "./types";

/** Portfolio case studies (static JSON — sourced from `data/builds.ts`). */
export const builds = buildRecords;

export function getBuildBySlug(slug: string): Build | undefined {
  return builds.find((b) => b.slug === slug);
}

export function getBuildsForVehicle(vehicleSlug: string): Build[] {
  return builds.filter((b) => b.vehicleSlug === vehicleSlug);
}

export function listBuildSlugs(): string[] {
  return builds.map((b) => b.slug);
}
