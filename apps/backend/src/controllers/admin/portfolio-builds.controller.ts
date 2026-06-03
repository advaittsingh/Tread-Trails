import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { prismaPortfolioBuildToBuild } from "../../lib/catalog/map-portfolio-build.js";
import { prisma } from "../../lib/prisma.js";
import {
  assertPortfolioBuildVehicleSlug,
  replacePortfolioBuildProductLinks,
  UnknownPortfolioProductRefError,
} from "../../services/admin/admin-sync-portfolio-build-products.js";
import { UnknownVehicleSlugError } from "../../services/admin/admin-sync-product-compatibility.js";
import { adminPortfolioBuildCreateSchema } from "../../lib/validators/admin-portfolio-build.js";
import { adminPortfolioBuildPatchSchema } from "../../lib/validators/admin-portfolio-build.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, mapUniqueSlugResponse, pagination, validationError } from "./utils.js";

export async function listPortfolioBuilds(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();
  const vehicle = String(req.query.vehicle ?? "").trim();

  const where: Prisma.PortfolioBuildWhereInput = {};
  const clauses: Prisma.PortfolioBuildWhereInput[] = [];
  if (vehicle) clauses.push({ vehicleSlug: vehicle });
  if (search) {
    clauses.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { vehicleSlug: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (clauses.length === 1) {
    Object.assign(where, clauses[0]);
  } else if (clauses.length > 1) {
    where.AND = clauses;
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.portfolioBuild.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.portfolioBuild.count({ where }),
    ]);

    return res.json({
      builds: rows.map((row) => ({
        id: row.id,
        legacyId: row.legacyId ?? null,
        build: prismaPortfolioBuildToBuild(row),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load builds" });
  }
}

export async function createPortfolioBuild(req: AuthedRequest, res: Response) {
  const parsed = adminPortfolioBuildCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const body = parsed.data;

  try {
    const row = await prisma.$transaction(async (tx) => {
      await assertPortfolioBuildVehicleSlug(body.vehicleSlug, tx);

      const created = await tx.portfolioBuild.create({
        data: {
          slug: body.slug,
          title: body.title,
          vehicleSlug: body.vehicleSlug,
          summary: body.summary,
          description: body.description,
          beforeImage: body.beforeImage,
          afterImage: body.afterImage,
          gallery: body.gallery,
          productIds: [],
          legacyId: body.legacyId ?? null,
          homeSpotlightRank: body.homeSpotlightRank ?? null,
        },
      });

      await replacePortfolioBuildProductLinks(
        created.id,
        body.productIds ?? [],
        tx
      );

      return created;
    });

    const full = await prisma.portfolioBuild.findUniqueOrThrow({
      where: { id: row.id },
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "build.create",
      entity: "portfolio_build",
      entityId: full.id,
      meta: { slug: full.slug },
    });

    return res.json({
      id: full.id,
      legacyId: full.legacyId ?? null,
      build: prismaPortfolioBuildToBuild(full),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return res.status(400).json({
        error: "Unknown vehicle slug(s)",
        missing: e.missingSlugs,
      });
    }
    if (e instanceof UnknownPortfolioProductRefError) {
      return res.status(400).json({
        error: "Unknown product ref(s)",
        missing: e.missingRefs,
      });
    }
    if (mapUniqueSlugResponse(e, res)) return;
    console.error(e);
    return res.status(500).json({ error: "Create failed" });
  }
}

export async function getPortfolioBuild(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const row = await prisma.portfolioBuild.findUnique({ where: { id } });
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({
      id: row.id,
      legacyId: row.legacyId ?? null,
      build: prismaPortfolioBuildToBuild(row),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load build" });
  }
}

export async function patchPortfolioBuild(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = adminPortfolioBuildPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

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
        return res.status(404).json({ error: "Not found" });
      }
      return res.json({
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
      return res.status(404).json({ error: "Not found" });
    }

    await logAdminAction({
      adminId: adminId(req),
      action: "build.update",
      entity: "portfolio_build",
      entityId: id,
    });

    return res.json({
      id: row.id,
      legacyId: row.legacyId ?? null,
      build: prismaPortfolioBuildToBuild(row),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return res.status(400).json({
        error: "Unknown vehicle slug(s)",
        missing: e.missingSlugs,
      });
    }
    if (e instanceof UnknownPortfolioProductRefError) {
      return res.status(400).json({
        error: "Unknown product ref(s)",
        missing: e.missingRefs,
      });
    }
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    if (mapUniqueSlugResponse(e, res)) return;
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function deletePortfolioBuild(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;

  try {
    await prisma.portfolioBuild.delete({ where: { id } });
    await logAdminAction({
      adminId: adminId(req),
      action: "build.delete",
      entity: "portfolio_build",
      entityId: id,
    });
    return res.json({ ok: true });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Delete failed" });
  }
}
