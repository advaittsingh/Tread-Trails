import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "@/lib/catalog/map-product";
import {
  UnknownVehicleSlugError,
  replaceProductVehicleCompatibilityBySlug,
} from "@/lib/server/admin-sync-product-compatibility";
import { prisma } from "@/lib/prisma";
import { adminProductPatchSchema } from "@/lib/validations/admin-product";

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

type RouteCtx = { params: { id: string } };

export async function GET(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { id } = context.params;

  try {
    const row = await prisma.product.findUnique({
      where: { id },
      include: productWithVehicleCompatInclude,
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: row.id,
      product: prismaProductToDTO(row),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
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

  const parsed = adminProductPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const data: Prisma.ProductUpdateInput = {};

  if (body.slug !== undefined) data.slug = body.slug;
  if (body.name !== undefined) data.name = body.name;
  if (body.brand !== undefined) data.brand = body.brand;
  if (body.category !== undefined) data.category = body.category;
  if (body.price !== undefined) data.price = body.price;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.images !== undefined) data.images = body.images;
  if (body.description !== undefined) data.description = body.description;
  if (body.specs !== undefined) {
    data.specs = body.specs as unknown as Prisma.InputJsonValue;
  }
  if (body.variants !== undefined) {
    data.variants = body.variants as unknown as Prisma.InputJsonValue;
  }
  if (body.legacyId !== undefined) data.legacyId = body.legacyId;

  const vehicleSlugsKeyPresent = Object.prototype.hasOwnProperty.call(
    body,
    "vehicleSlugs"
  );

  try {
    const hasScalarUpdates = Object.keys(data).length > 0;

    if (!hasScalarUpdates && !(vehicleSlugsKeyPresent && body.vehicleSlugs !== undefined)) {
      const existing = await prisma.product.findUnique({
        where: { id },
        include: productWithVehicleCompatInclude,
      });
      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        id: existing.id,
        product: prismaProductToDTO(existing),
      });
    }

    await prisma.$transaction(async (tx) => {
      if (hasScalarUpdates) {
        await tx.product.update({ where: { id }, data });
      }
      if (vehicleSlugsKeyPresent && body.vehicleSlugs !== undefined) {
        await replaceProductVehicleCompatibilityBySlug(
          id,
          body.vehicleSlugs,
          tx
        );
      }
    });

    const row = await prisma.product.findUnique({
      where: { id },
      include: productWithVehicleCompatInclude,
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "product.update",
      entity: "product",
      entityId: id,
    });

    return NextResponse.json({
      id: row.id,
      product: prismaProductToDTO(row),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return NextResponse.json(
        { error: "Unknown vehicle slug(s)", missing: e.missingSlugs },
        { status: 400 }
      );
    }
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const conflict = mapUniqueSlugResponse(e);
    if (conflict) return conflict;
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { id } = context.params;

  try {
    await prisma.product.delete({ where: { id } });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "product.delete",
      entity: "product",
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
