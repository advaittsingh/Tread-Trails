import { NextResponse } from "next/server";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";
import { prisma } from "@/lib/prisma";
import { vehicleMakePatchSchema } from "@/lib/validations/admin-vehicle-hierarchy";

type RouteCtx = { params: { id: string } };

export async function PATCH(req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = vehicleMakePatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const row = await prisma.vehicleMake.update({
      where: { id: context.params.id },
      data: parsed.data,
    });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle_make.update",
      entity: "vehicle_make",
      entityId: row.id,
    });
    revalidateVehicleCatalog();
    return NextResponse.json({ make: row });
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

  try {
    await prisma.vehicleMake.delete({ where: { id: context.params.id } });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle_make.delete",
      entity: "vehicle_make",
      entityId: context.params.id,
    });
    revalidateVehicleCatalog();
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
