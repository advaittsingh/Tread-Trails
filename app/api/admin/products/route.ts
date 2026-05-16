import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "@/lib/catalog/map-product";
import {
  UnknownVehicleSlugError,
  replaceProductVehicleCompatibilityBySlug,
} from "@/lib/server/admin-sync-product-compatibility";
import { prisma } from "@/lib/prisma";
import { revalidateProductCatalog } from "@/lib/server/product-catalog";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";
import { adminProductCreateSchema } from "@/lib/validations/admin-product";

function mapUniqueSlugResponse(e: unknown): NextResponse | null {
  if (
    e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    e.code === "P2002"
  ) {
    const meta = e.meta as { target?: unknown } | undefined;
    const target = meta?.target;
    const fields = Array.isArray(target) ? target.join(", ") : String(target ?? "field");
    return NextResponse.json(
      { error: "Conflict", detail: `Unique constraint on ${fields}` },
      { status: 409 }
    );
  }
  return null;
}

/** Paginated catalog with internal ids for editor surfaces. */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();
  const brand = searchParams.get("brand")?.trim();
  const category = searchParams.get("category")?.trim();

  const where: Prisma.ProductWhereInput = {};
  const clauses: Prisma.ProductWhereInput[] = [];
  if (search) {
    clauses.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (brand) {
    clauses.push({ brand: { contains: brand, mode: "insensitive" } });
  }
  if (category) {
    clauses.push({ category: { contains: category, mode: "insensitive" } });
  }
  if (clauses.length === 1) {
    Object.assign(where, clauses[0]);
  } else if (clauses.length > 1) {
    where.AND = clauses;
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productWithVehicleCompatInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: rows.map((p) => ({
        id: p.id,
        product: prismaProductToDTO(p),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

/** Create product + optional explicit vehicle compatibility rows. */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminProductCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const prod = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          slug: body.slug,
          name: body.name,
          brand: body.brand,
          category: body.category,
          price: body.price ?? null,
          currency: body.currency,
          images: body.images,
          description: body.description,
          specs: body.specs as unknown as Prisma.InputJsonValue,
          variants: (body.variants ?? []) as unknown as Prisma.InputJsonValue,
          legacyId: body.legacyId ?? null,
        },
      });
      await replaceProductVehicleCompatibilityBySlug(
        created.id,
        body.vehicleSlugs,
        tx
      );
      return created;
    });

    const full = await prisma.product.findUniqueOrThrow({
      where: { id: prod.id },
      include: productWithVehicleCompatInclude,
    });

    revalidateProductCatalog();
    revalidateVehicleCatalog();
    return NextResponse.json({
      id: full.id,
      product: prismaProductToDTO(full),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return NextResponse.json(
        { error: "Unknown vehicle slug(s)", missing: e.missingSlugs },
        { status: 400 }
      );
    }
    const conflict = mapUniqueSlugResponse(e);
    if (conflict) return conflict;
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
