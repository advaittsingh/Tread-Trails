import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { prismaPortfolioBuildToBuild } from "@/lib/catalog/map-portfolio-build";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/request-user";
import {
  assertPortfolioBuildVehicleSlug,
  replacePortfolioBuildProductLinks,
  UnknownPortfolioProductRefError,
} from "@/lib/server/admin-sync-portfolio-build-products";
import { UnknownVehicleSlugError } from "@/lib/server/admin-sync-product-compatibility";
import { adminPortfolioBuildCreateSchema } from "@/lib/validations/admin-portfolio-build";

function mapUniqueSlugResponse(e: unknown): NextResponse | null {
  if (
    e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    e.code === "P2002"
  ) {
    const meta = e.meta as { target?: unknown } | undefined;
    const target = meta?.target;
    const fields = Array.isArray(target)
      ? target.join(", ")
      : String(target ?? "field");
    return NextResponse.json(
      { error: "Conflict", detail: `Unique constraint on ${fields}` },
      { status: 409 }
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();
  const vehicle = searchParams.get("vehicle")?.trim();

  const where: Prisma.PortfolioBuildWhereInput = {};
  const clauses: Prisma.PortfolioBuildWhereInput[] = [];
  if (vehicle) {
    clauses.push({ vehicleSlug: vehicle });
  }
  if (search) {
    clauses.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { vehicleSlug: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (clauses.length === 1) {
    Object.assign(where, clauses[0]);
  } else if (clauses.length > 1) {
    where.AND = clauses;
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.portfolioBuild.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.portfolioBuild.count({ where }),
    ]);

    return NextResponse.json({
      builds: rows.map((row) => ({
        id: row.id,
        legacyId: row.legacyId ?? null,
        build: prismaPortfolioBuildToBuild(row),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load builds" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminPortfolioBuildCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const row = await prisma.$transaction(async (tx) => {
      await assertPortfolioBuildVehicleSlug(body.vehicleSlug, tx);

      const created = await tx.portfolioBuild.create({
        data: {
          slug: body.slug,
          title: body.title,
          vehicleSlug: body.vehicleSlug,
          summary: body.summary,
          description: body.description,
          beforeImage: body.beforeImage,
          afterImage: body.afterImage,
          gallery: body.gallery,
          productIds: [],
          legacyId: body.legacyId ?? null,
          homeSpotlightRank: body.homeSpotlightRank ?? null,
        },
      });

      await replacePortfolioBuildProductLinks(
        created.id,
        body.productIds ?? [],
        tx
      );

      return created;
    });

    const full = await prisma.portfolioBuild.findUniqueOrThrow({
      where: { id: row.id },
    });

    return NextResponse.json({
      id: full.id,
      legacyId: full.legacyId ?? null,
      build: prismaPortfolioBuildToBuild(full),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return NextResponse.json(
        { error: "Unknown vehicle slug(s)", missing: e.missingSlugs },
        { status: 400 }
      );
    }
    if (e instanceof UnknownPortfolioProductRefError) {
      return NextResponse.json(
        { error: "Unknown product ref(s)", missing: e.missingRefs },
        { status: 400 }
      );
    }
    const conflict = mapUniqueSlugResponse(e);
    if (conflict) return conflict;
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
