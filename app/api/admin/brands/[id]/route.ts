import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { recomputeBrandProductCount } from "@/lib/server/recompute-brand-product-count";
import { prisma } from "@/lib/prisma";
import { adminBrandPatchSchema } from "@/lib/validations/admin-brand";

type RouteCtx = { params: { id: string } };

export async function GET(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const brand = await prisma.brand.findUnique({ where: { id: context.params.id } });
  if (!brand) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ brand });
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

  const parsed = adminBrandPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data: Prisma.BrandUpdateInput = { ...parsed.data };

  try {
    const brand = await prisma.brand.update({ where: { id }, data });
    const productCount = await recomputeBrandProductCount(id);

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "brand.update",
      entity: "brand",
      entityId: id,
    });

    return NextResponse.json({ brand: { ...brand, productCount } });
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
    await prisma.brand.delete({ where: { id } });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "brand.delete",
      entity: "brand",
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
