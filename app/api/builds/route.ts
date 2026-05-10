import { NextResponse } from "next/server";

import { builds as staticBuilds } from "@/data/build";
import { portfolioBuildPayload } from "@/lib/api/portfolio-payload";
import { prismaPortfolioBuildToBuild } from "@/lib/catalog/map-portfolio-build";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  const vehicleSlug = searchParams.get("vehicleSlug")?.trim();

  function staticList() {
    return vehicleSlug
      ? staticBuilds.filter((b) => b.vehicleSlug === vehicleSlug)
      : staticBuilds;
  }

  try {
    if (slug) {
      const row = await prisma.portfolioBuild.findUnique({ where: { slug } });
      if (row) {
        return NextResponse.json({
          build: portfolioBuildPayload(prismaPortfolioBuildToBuild(row)),
        });
      }
      const fallback = staticBuilds.find((b) => b.slug === slug);
      if (fallback) {
        return NextResponse.json({ build: portfolioBuildPayload(fallback) });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const where = vehicleSlug ? { vehicleSlug } : undefined;

    const rows = await prisma.portfolioBuild.findMany({
      where,
      orderBy: { title: "asc" },
    });

    if (rows.length > 0) {
      return NextResponse.json({
        builds: rows.map((r) =>
          portfolioBuildPayload(prismaPortfolioBuildToBuild(r))
        ),
      });
    }

    return NextResponse.json({
      builds: staticList().map((b) => portfolioBuildPayload(b)),
    });
  } catch (e) {
    console.error(e);
    if (slug) {
      const fallback = staticBuilds.find((b) => b.slug === slug);
      if (fallback) {
        return NextResponse.json({ build: portfolioBuildPayload(fallback) });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      builds: staticList().map((b) => portfolioBuildPayload(b)),
    });
  }
}
