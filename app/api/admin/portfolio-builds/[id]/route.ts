import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { prismaPortfolioBuildToBuild } from "@/lib/catalog/map-portfolio-build";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import {
  assertPortfolioBuildVehicleSlug,
  replacePortfolioBuildProductLinks,
  UnknownPortfolioProductRefError,
} from "@/lib/server/admin-sync-portfolio-build-products";
import { UnknownVehicleSlugError } from "@/lib/server/admin-sync-product-compatibility";
import { adminPortfolioBuildPatchSchema } from "@/lib/validations/admin-portfolio-build";

function mapUniqueSlugResponse(e: unknown): NextResponse | null {
  if (
    e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    e.code === "P2002"
  ) {
    const meta = e.meta as { target?: unknown } | undefined;
    const target = meta?.target;
    const fields = Array.isArray(target)
      ? target.join(", ")
      : String(target ?? "field");
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
    const row = await prisma.portfolioBuild.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: row.id,
      legacyId: row.legacyId ?? null,
      build: prismaPortfolioBuildToBuild(row),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load build" }, { status: 500 });
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

  const parsed = adminPortfolioBuildPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const data: Prisma.PortfolioBuildUpdateInput = {};

  if (body.slug !== undefined) data.slug = body.slug;
  if (body.title !== undefined) data.title = body.title;
  if (body.vehicleSlug !== undefined) data.vehicleSlug = body.vehicleSlug;
  if (body.summary !== undefined) data.summary = body.summary;
  if (body.description !== undefined) data.description = body.description;
  if (body.beforeImage !== undefined) data.beforeImage = body.beforeImage;
  if (body.afterImage !== undefined) data.afterImage = body.afterImage;
  if (body.gallery !== undefined) data.gallery = body.gallery;
  if (body.legacyId !== undefined) data.legacyId = body.legacyId;
  if (body.homeSpotlightRank !== undefined) {
    data.homeSpotlightRank = body.homeSpotlightRank;
  }

  const productIdsKeyPresent = Object.prototype.hasOwnProperty.call(
    body,
    "productIds"
  );

  try {
    const hasScalarUpdates = Object.keys(data).length > 0;

    if (
      !hasScalarUpdates &&
      !(productIdsKeyPresent && body.productIds !== undefined)
    ) {
      const existing = await prisma.portfolioBuild.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        id: existing.id,
        legacyId: existing.legacyId ?? null,
        build: prismaPortfolioBuildToBuild(existing),
      });
    }

    await prisma.$transaction(async (tx) => {
      if (body.vehicleSlug !== undefined) {
        await assertPortfolioBuildVehicleSlug(body.vehicleSlug, tx);
      }

      if (hasScalarUpdates) {
        await tx.portfolioBuild.update({ where: { id }, data });
      }

      if (productIdsKeyPresent && body.productIds !== undefined) {
        await replacePortfolioBuildProductLinks(id, body.productIds, tx);
      }
    });

    const row = await prisma.portfolioBuild.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "build.update",
      entity: "portfolio_build",
      entityId: id,
    });

    return NextResponse.json({
      id: row.id,
      legacyId: row.legacyId ?? null,
      build: prismaPortfolioBuildToBuild(row),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return NextResponse.json(
        { error: "Unknown vehicle slug(s)", missing: e.missingSlugs },
        { status: 400 }
      );
    }
    if (e instanceof UnknownPortfolioProductRefError) {
      return NextResponse.json(
        { error: "Unknown product ref(s)", missing: e.missingRefs },
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
    await prisma.portfolioBuild.delete({ where: { id } });
    await logAdminAction({
      adminId: gate.auth.userId,
      action: "build.delete",
      entity: "portfolio_build",
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
