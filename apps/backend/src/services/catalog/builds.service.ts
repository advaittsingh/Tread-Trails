import type { Build } from "@tread-trails/shared-types";

import { prismaPortfolioBuildToBuild } from "../../lib/catalog/map-portfolio-build.js";
import { portfolioBuildPayload } from "../../lib/api/portfolio-payload.js";
import { loadStaticBuilds } from "../../lib/static-data.js";
import { prisma } from "../../lib/prisma.js";

export const buildsService = {
  portfolioBuildPayload,

  async list(vehicleSlug?: string): Promise<Build[]> {
    const where = vehicleSlug?.trim() ? { vehicleSlug: vehicleSlug.trim() } : undefined;

    try {
      const rows = await prisma.portfolioBuild.findMany({
        where,
        orderBy: { title: "asc" },
      });
      if (rows.length > 0) {
        return rows.map(prismaPortfolioBuildToBuild);
      }
    } catch {
      /* ignore */
    }

    const staticBuilds = await loadStaticBuilds();
    if (vehicleSlug?.trim()) {
      return staticBuilds.filter((b) => b.vehicleSlug === vehicleSlug.trim());
    }
    return staticBuilds;
  },

  async getBySlug(slug: string): Promise<Build | null> {
    const trimmed = slug.trim();
    if (!trimmed) return null;

    try {
      const row = await prisma.portfolioBuild.findUnique({ where: { slug: trimmed } });
      if (row) return prismaPortfolioBuildToBuild(row);
    } catch {
      /* ignore */
    }

    const staticBuilds = await loadStaticBuilds();
    return staticBuilds.find((b) => b.slug === trimmed) ?? null;
  },
};
