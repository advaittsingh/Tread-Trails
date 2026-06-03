import type { Request, Response } from "express";
import { z } from "zod";

import type { ProductListFilters } from "../../lib/admin/product-list.js";
import {
  buildProductsWhere,
  getAdminProductDetailBundle,
  getProductsSummary,
  listAdminProducts,
  productsToCsv,
} from "../../services/admin/products-admin.service.js";
import {
  UnknownVehicleSlugError,
  replaceProductVehicleCompatibilityBySlug,
} from "../../services/admin/admin-sync-product-compatibility.js";
import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

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

export async function getProductsSummaryHandler(_req: Request, res: Response) {
  try {
    const summary = await getProductsSummary();
    res.setHeader("Cache-Control", "private, max-age=20");
    return res.json(summary);
  } catch (e) {
    console.error("[admin/products/summary]", e);
    return res.status(500).json({ error: "Failed to load product summary" });
  }
}

export async function exportProducts(req: Request, res: Response) {
  try {
    const filters = parseListFilters(req);
    const where = await buildProductsWhere(filters);
    const { products } = await listAdminProducts(
      where,
      0,
      10_000,
      filters.stockStatus
    );
    const csv = productsToCsv(products);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tread-trails-products-${Date.now()}.csv"`
    );
    return res.send(csv);
  } catch (e) {
    console.error("[admin/products/export]", e);
    return res.status(500).json({ error: "Export failed" });
  }
}

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  brand: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(120).optional(),
  price: z.number().int().min(0).nullable().optional(),
  priceDelta: z.number().int().optional(),
  stockDelta: z.number().int().optional(),
  vehicleSlugs: z.array(z.string().min(1)).max(32).optional(),
});

export async function bulkPatchProducts(req: AuthedRequest, res: Response) {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const aid = adminId(req);
  const { ids, brand, category, price, priceDelta, stockDelta, vehicleSlugs } =
    parsed.data;

  try {
    const updated: string[] = [];

    for (const id of ids) {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id },
          include: { inventory: true },
        });
        if (!product) return;

        const data: Record<string, unknown> = {};
        if (brand !== undefined) data.brand = brand;
        if (category !== undefined) data.category = category;
        if (price !== undefined) {
          data.price = price;
        } else if (priceDelta !== undefined && product.price != null) {
          data.price = Math.max(0, product.price + priceDelta);
        }

        if (Object.keys(data).length > 0) {
          await tx.product.update({ where: { id }, data });
        }

        if (stockDelta !== undefined && product.inventory) {
          const next = Math.max(
            0,
            product.inventory.stockQuantity + stockDelta
          );
          await tx.productInventory.update({
            where: { id: product.inventory.id },
            data: { stockQuantity: next },
          });
        }

        if (vehicleSlugs !== undefined) {
          await replaceProductVehicleCompatibilityBySlug(
            id,
            vehicleSlugs,
            tx
          );
        }
      });

      updated.push(id);
      await logAdminAction({
        adminId: aid,
        action: "product.bulk_update",
        entity: "product",
        entityId: id,
      });
    }

    return res.json({ updated, count: updated.length });
  } catch (e) {
    if (e instanceof UnknownVehicleSlugError) {
      return res.status(400).json({
        error: "Unknown vehicle slug(s)",
        missing: e.missingSlugs,
      });
    }
    console.error("[admin/products/bulk]", e);
    return res.status(500).json({ error: "Bulk update failed" });
  }
}

export async function getProductBundle(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const bundle = await getAdminProductDetailBundle(id);
    if (!bundle) return res.status(404).json({ error: "Not found" });
    return res.json(bundle);
  } catch (e) {
    console.error("[admin/products/bundle]", e);
    return res.status(500).json({ error: "Failed to load product" });
  }
}
