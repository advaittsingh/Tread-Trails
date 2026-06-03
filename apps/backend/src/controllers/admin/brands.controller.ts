import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { prisma } from "../../lib/prisma.js";
import { recomputeBrandProductCount } from "../../services/admin/recompute-brand-product-count.js";
import { adminBrandCreateSchema } from "../../lib/validators/admin-brand.js";
import { adminBrandPatchSchema } from "../../lib/validators/admin-brand.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

export async function listBrands(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();

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

    return res.json({
      brands: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load brands" });
  }
}

export async function createBrand(req: AuthedRequest, res: Response) {
  const parsed = adminBrandCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

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
      adminId: adminId(req),
      action: "brand.create",
      entity: "brand",
      entityId: created.id,
      meta: { slug: created.slug },
    });

    return res.json({ brand: { ...created, productCount } });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return res.status(409).json({ error: "Slug already exists" });
    }
    console.error(e);
    return res.status(500).json({ error: "Create failed" });
  }
}

export async function getBrand(req: Request, res: Response) {
  const brand = await prisma.brand.findUnique({
    where: { id: req.params.id as string },
  });
  if (!brand) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json({ brand });
}

export async function patchBrand(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = adminBrandPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const brand = await prisma.brand.update({
      where: { id },
      data: parsed.data,
    });
    const productCount = await recomputeBrandProductCount(id);

    await logAdminAction({
      adminId: adminId(req),
      action: "brand.update",
      entity: "brand",
      entityId: id,
    });

    return res.json({ brand: { ...brand, productCount } });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function deleteBrand(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  try {
    await prisma.brand.delete({ where: { id } });
    await logAdminAction({
      adminId: adminId(req),
      action: "brand.delete",
      entity: "brand",
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
