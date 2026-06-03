import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { extractChange } from "../../lib/admin/audit-diff.js";
import {
  revalidateProductCatalog,
  revalidateVehicleCatalog,
} from "../../lib/admin/catalog-revalidate.js";
import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
} from "../../lib/catalog/map-product.js";
import { prisma } from "../../lib/prisma.js";
import {
  UnknownVehicleSlugError,
  replaceProductVehicleCompatibilityBySlug,
} from "../../services/admin/admin-sync-product-compatibility.js";
import { adminProductCreateSchema } from "../../lib/validators/admin-product.js";
import { adminProductPatchSchema } from "../../lib/validators/admin-product.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import type { ProductListFilters } from "../../lib/admin/product-list.js";
import {
  buildProductsWhere,
  listAdminProducts,
} from "../../services/admin/products-admin.service.js";
import { adminId, mapUniqueSlugResponse, pagination, validationError } from "./utils.js";

function parseListFilters(req: Request): ProductListFilters {
  return {
    search: String(req.query.search ?? "").trim() || undefined,
    sku: String(req.query.sku ?? "").trim() || undefined,
    brand: String(req.query.brand ?? "").trim() || undefined,
    category: String(req.query.category ?? "").trim() || undefined,
    vehicle: String(req.query.vehicle ?? "").trim() || undefined,
    stockStatus: String(req.query.stockStatus ?? "").trim() || undefined,
    publicationStatus:
      String(req.query.publicationStatus ?? "").trim() || undefined,
  };
}

export async function listProducts(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const filters = parseListFilters(req);

  try {
    const where = await buildProductsWhere(filters);
    const { products, total } = await listAdminProducts(
      where,
      skip,
      limit,
      filters.stockStatus
    );

    return res.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load products" });
  }
}

export async function createProduct(req: AuthedRequest, res: Response) {
  const parsed = adminProductCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const body = parsed.data;

  try {
    const prod = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          slug: body.slug,
          name: body.name,
          brand: body.brand,
          category: body.category,
          price: body.price ?? null,
          currency: body.currency,
          images: body.images,
          description: body.description,
          specs: body.specs as unknown as Prisma.InputJsonValue,
          variants: (body.variants ?? []) as unknown as Prisma.InputJsonValue,
          legacyId: body.legacyId ?? null,
        },
      });
      await replaceProductVehicleCompatibilityBySlug(
        created.id,
        body.vehicleSlugs,
        tx
      );
      return created;
    });

    const full = await prisma.product.findUniqueOrThrow({
      where: { id: prod.id },
      include: productWithVehicleCompatInclude,
    });

    revalidateProductCatalog();
    revalidateVehicleCatalog();

    await logAdminAction({
      adminId: adminId(req),
      action: "product.create",
      entity: "product",
      entityId: full.id,
      meta: { slug: full.slug },
    });

    return res.json({
      id: full.id,
      product: prismaProductToDTO(full),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return res.status(400).json({
        error: "Unknown vehicle slug(s)",
        missing: e.missingSlugs,
      });
    }
    if (mapUniqueSlugResponse(e, res)) return;
    console.error(e);
    return res.status(500).json({ error: "Create failed" });
  }
}

export async function getProduct(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const row = await prisma.product.findUnique({
      where: { id },
      include: productWithVehicleCompatInclude,
    });
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({
      id: row.id,
      product: prismaProductToDTO(row),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load product" });
  }
}

export async function patchProduct(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = adminProductPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

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
    const beforeRow = await prisma.product.findUnique({
      where: { id },
      include: productWithVehicleCompatInclude,
    });
    if (!beforeRow) {
      return res.status(404).json({ error: "Not found" });
    }

    const hasScalarUpdates = Object.keys(data).length > 0;

    if (
      !hasScalarUpdates &&
      !(vehicleSlugsKeyPresent && body.vehicleSlugs !== undefined)
    ) {
      return res.json({
        id: beforeRow.id,
        product: prismaProductToDTO(beforeRow),
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
      return res.status(404).json({ error: "Not found" });
    }

    const prevDto = prismaProductToDTO(beforeRow);
    const patchPayload: Record<string, unknown> = { ...body };
    const change = extractChange(
      prevDto as unknown as Record<string, unknown>,
      patchPayload
    );

    await logAdminAction({
      adminId: adminId(req),
      action: "product.update",
      entity: "product",
      entityId: id,
      previousValue: change?.previousValue ?? null,
      newValue: change?.newValue ?? null,
    });

    revalidateProductCatalog();
    revalidateVehicleCatalog();
    return res.json({
      id: row.id,
      product: prismaProductToDTO(row),
    });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return res.status(400).json({
        error: "Unknown vehicle slug(s)",
        missing: e.missingSlugs,
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

export async function deleteProduct(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;

  try {
    await prisma.product.delete({ where: { id } });
    await logAdminAction({
      adminId: adminId(req),
      action: "product.delete",
      entity: "product",
      entityId: id,
    });
    revalidateProductCatalog();
    revalidateVehicleCatalog();
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
