import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";
import { prisma } from "@/lib/prisma";
import { vehicleMakeCreateSchema } from "@/lib/validations/admin-vehicle-hierarchy";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();

  const where: Prisma.VehicleMakeWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const makes = await prisma.vehicleMake.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { models: true } },
      },
    });
    return NextResponse.json({ makes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load makes" }, { status: 500 });
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

  const parsed = vehicleMakeCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.vehicleMake.create({ data: parsed.data });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle_make.create",
      entity: "vehicle_make",
      entityId: created.id,
      meta: { slug: created.slug },
    });
    revalidateVehicleCatalog();
    return NextResponse.json({ make: created });
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
