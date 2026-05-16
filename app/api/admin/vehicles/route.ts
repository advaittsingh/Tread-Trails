import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import {
  buildVehicleWhere,
  mapVehicleRowToCar,
} from "@/lib/catalog/vehicle-hierarchy";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";
import { prisma } from "@/lib/prisma";
import {
  adminVehicleCreateSchema,
} from "@/lib/validations/admin-vehicle";

function mapUniqueSlugResponse(e: unknown): NextResponse | null {
  if (
    e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    e.code === "P2002"
  ) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
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
  const category = searchParams.get("category")?.trim();
  const makeId = searchParams.get("makeId")?.trim();
  const modelId = searchParams.get("modelId")?.trim();

  const where = buildVehicleWhere({
    search,
    category,
    makeId,
    modelId,
  }) as Prisma.VehicleWhereInput;

  try {
    const [rows, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: [
          { sortOrder: "asc" },
          { model: { make: { name: "asc" } } },
          { model: { name: "asc" } },
          { name: "asc" },
        ],
        skip,
        take: limit,
        select: {
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
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      vehicles: rows.map((v) => ({
        id: v.id,
        vehicle: mapVehicleRowToCar(v),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 });
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

  const parsed = adminVehicleCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const created = await prisma.vehicle.create({
      data: {
        slug: body.slug,
        name: body.name,
        tagline: body.tagline,
        description: body.description,
        heroImage: body.heroImage,
        thumbnail: body.thumbnail,
        category: body.category,
        engineSummary: body.engineSummary,
        modelYearsLabel: body.modelYearsLabel,
        trimSummary: body.trimSummary,
        legacyId: body.legacyId ?? null,
        modelId: body.modelId ?? null,
        generationKey: body.generationKey ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    revalidateVehicleCatalog();
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle.create",
      entity: "vehicle",
      entityId: created.id,
      meta: { slug: created.slug },
    });

    return NextResponse.json({
      id: created.id,
      vehicle: mapVehicleRowToCar(created),
    });
  } catch (e) {
    const conflict = mapUniqueSlugResponse(e);
    if (conflict) return conflict;
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
