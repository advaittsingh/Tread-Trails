/**
 * Portfolio builds domain (sync): static `data/builds` helpers for client bundles
 * and booking forms. Prefer `@/lib/server/build-catalog` and `GET /api/builds` for
 * Neon-backed listings at request/build time.
 */
export {
  builds,
  getBuildBySlug,
  getBuildsForVehicle,
  listBuildSlugs,
} from "@/data/build";

export type { Build } from "@/data/types";
