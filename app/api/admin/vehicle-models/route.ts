import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";
import { prisma } from "@/lib/prisma";
import { vehicleModelCreateSchema } from "@/lib/validations/admin-vehicle-hierarchy";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const makeId = searchParams.get("makeId")?.trim();
  const search = searchParams.get("search")?.trim();

  const where: Prisma.VehicleModelWhereInput = {};
  if (makeId) where.makeId = makeId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const models = await prisma.vehicleModel.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        make: { select: { id: true, slug: true, name: true } },
        _count: { select: { vehicles: true } },
      },
    });
    return NextResponse.json({ models });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load models" }, { status: 500 });
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

  const parsed = vehicleModelCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.vehicleModel.create({ data: parsed.data });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle_model.create",
      entity: "vehicle_model",
      entityId: created.id,
      meta: { slug: created.slug, makeId: created.makeId },
    });
    revalidateVehicleCatalog();
    return NextResponse.json({ model: created });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json({ error: "Slug already exists for this make" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
