import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { recomputeBrandProductCount } from "@/lib/server/recompute-brand-product-count";
import { prisma } from "@/lib/prisma";
import { adminBrandCreateSchema } from "@/lib/validations/admin-brand";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();

  const where: Prisma.BrandWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.brand.count({ where }),
    ]);

    return NextResponse.json({
      brands: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
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

  const parsed = adminBrandCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const created = await prisma.brand.create({
      data: {
        slug: body.slug,
        name: body.name,
        tagline: body.tagline,
        logoSrc: body.logoSrc,
        sortOrder: body.sortOrder,
      },
    });
    const productCount = await recomputeBrandProductCount(created.id);

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "brand.create",
      entity: "brand",
      entityId: created.id,
      meta: { slug: created.slug },
    });

    return NextResponse.json({
      brand: { ...created, productCount },
    });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
