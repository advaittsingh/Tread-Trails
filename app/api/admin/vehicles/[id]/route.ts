import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { prismaVehicleToCar } from "@/lib/catalog/map-vehicle";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";
import { adminVehiclePatchSchema } from "@/lib/validations/admin-vehicle";

type RouteCtx = { params: { id: string } };

export async function GET(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const row = await prisma.vehicle.findUnique({ where: { id: context.params.id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ id: row.id, vehicle: prismaVehicleToCar(row) });
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
    const row = await prisma.vehicle.update({ where: { id }, data });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle.update",
      entity: "vehicle",
      entityId: id,
    });
    return NextResponse.json({ id: row.id, vehicle: prismaVehicleToCar(row) });
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
