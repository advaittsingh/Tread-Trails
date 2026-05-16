import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { mapVehicleRowToCar } from "@/lib/catalog/vehicle-hierarchy";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";
import { prisma } from "@/lib/prisma";
import { adminVehiclePatchSchema } from "@/lib/validations/admin-vehicle";

type RouteCtx = { params: { id: string } };

export async function GET(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const row = await prisma.vehicle.findUnique({
    where: { id: context.params.id },
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
      modelId: true,
      model: {
        select: {
          slug: true,
          name: true,
          make: { select: { slug: true, name: true } },
        },
      },
    },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ id: row.id, vehicle: mapVehicleRowToCar(row), modelId: row.modelId });
}

export async function PATCH(req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { id } = context.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminVehiclePatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const data: Prisma.VehicleUpdateInput = { ...body };

  try {
    const row = await prisma.vehicle.update({
      where: { id },
      data,
      include: {
        model: {
          select: {
            slug: true,
            name: true,
            make: { select: { slug: true, name: true } },
          },
        },
      },
    });
    revalidateVehicleCatalog();
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle.update",
      entity: "vehicle",
      entityId: id,
    });
    return NextResponse.json({ id: row.id, vehicle: mapVehicleRowToCar(row) });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { id } = context.params;
  try {
    await prisma.vehicle.delete({ where: { id } });
    revalidateVehicleCatalog();
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle.delete",
      entity: "vehicle",
      entityId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
