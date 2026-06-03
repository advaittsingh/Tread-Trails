import type { Request, Response } from "express";
import { z } from "zod";

import type { InventoryListFilters } from "../../lib/admin/inventory-list.js";
import {
  buildInventoryWhere,
  getInventoryInsights,
  getInventoryProductBundle,
  getInventorySummary,
  getPurchaseOrdersList,
  getReorderSuggestions,
  inventoryListToCsv,
  listAdminInventory,
} from "../../services/admin/inventory-admin.service.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";
import { prisma } from "../../lib/prisma.js";
import {
  bulkUpdateInventory,
} from "../../services/admin/inventory.service.js";
import { bulkInventorySchema } from "../../lib/validators/admin-inventory.js";
import { logAdminAction } from "../../lib/admin/admin-audit.js";

function parseFilters(req: Request): InventoryListFilters {
  return {
    search: String(req.query.search ?? "").trim() || undefined,
    brand: String(req.query.brand ?? "").trim() || undefined,
    vehicle: String(req.query.vehicle ?? "").trim() || undefined,
    stockStatus: String(req.query.stockStatus ?? "").trim() || undefined,
  };
}

export async function getInventorySummaryHandler(_req: Request, res: Response) {
  try {
    const summary = await getInventorySummary();
    res.setHeader("Cache-Control", "private, max-age=15");
    return res.json(summary);
  } catch (e) {
    console.error("[admin/inventory/summary]", e);
    return res.status(500).json({ error: "Failed to load inventory summary" });
  }
}

export async function listInventoryEnriched(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const filters = parseFilters(req);

  try {
    const where = await buildInventoryWhere(filters);
    const { items, total } = await listAdminInventory(
      where,
      skip,
      limit,
      filters.stockStatus
    );

    return res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("[admin/inventory/list]", e);
    return res.status(500).json({ error: "Failed to load inventory" });
  }
}

export async function exportInventoryEnriched(req: Request, res: Response) {
  try {
    const filters = parseFilters(req);
    const where = await buildInventoryWhere(filters);
    const { items } = await listAdminInventory(where, 0, 10_000, filters.stockStatus);
    const csv = inventoryListToCsv(items);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tread-trails-inventory-${Date.now()}.csv"`
    );
    return res.send(csv);
  } catch (e) {
    console.error("[admin/inventory/export-enriched]", e);
    return res.status(500).json({ error: "Export failed" });
  }
}

export async function getInventoryProductBundleHandler(req: Request, res: Response) {
  const productId = req.params.productId as string;
  try {
    const bundle = await getInventoryProductBundle(productId);
    if (!bundle) return res.status(404).json({ error: "Not found" });
    return res.json(bundle);
  } catch (e) {
    console.error("[admin/inventory/bundle]", e);
    return res.status(500).json({ error: "Failed to load product inventory" });
  }
}

export async function getReorderSuggestionsHandler(_req: Request, res: Response) {
  try {
    const suggestions = await getReorderSuggestions();
    return res.json({ suggestions });
  } catch (e) {
    console.error("[admin/inventory/reorder]", e);
    return res.status(500).json({ error: "Failed to load reorder suggestions" });
  }
}

export async function getPurchaseOrdersHandler(_req: Request, res: Response) {
  try {
    const orders = await getPurchaseOrdersList();
    return res.json({ orders });
  } catch (e) {
    console.error("[admin/inventory/purchase-orders]", e);
    return res.status(500).json({ error: "Failed to load purchase orders" });
  }
}

export async function getInventoryInsightsHandler(_req: Request, res: Response) {
  try {
    const insights = await getInventoryInsights();
    return res.json(insights);
  } catch (e) {
    console.error("[admin/inventory/insights]", e);
    return res.status(500).json({ error: "Failed to load insights" });
  }
}

const bulkIdsSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(100),
  stockDelta: z.number().int().optional(),
  incomingDelta: z.number().int().optional(),
});

export async function bulkInventoryByIds(req: AuthedRequest, res: Response) {
  const parsed = bulkIdsSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const rows = [];
    for (const productId of parsed.data.productIds) {
      const inv = await prisma.productInventory.findUnique({
        where: { productId },
        select: { sku: true, stockQuantity: true, incomingQuantity: true },
      });
      if (!inv) continue;
      rows.push({
        sku: inv.sku,
        stockQuantity:
          parsed.data.stockDelta !== undefined
            ? Math.max(0, inv.stockQuantity + parsed.data.stockDelta)
            : undefined,
        incomingQuantity:
          parsed.data.incomingDelta !== undefined
            ? Math.max(0, inv.incomingQuantity + parsed.data.incomingDelta)
            : undefined,
      });
    }

    const result = await bulkUpdateInventory(rows, adminId(req));
    await logAdminAction({
      adminId: adminId(req),
      action: "inventory.bulk_by_ids",
      entity: "inventory",
      entityId: "bulk",
    });
    return res.json(result);
  } catch (e) {
    console.error("[admin/inventory/bulk-ids]", e);
    return res.status(500).json({ error: "Bulk update failed" });
  }
}

export async function bulkInventoryRows(req: AuthedRequest, res: Response) {
  const parsed = bulkInventorySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await bulkUpdateInventory(parsed.data.rows, adminId(req));
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Bulk update failed" });
  }
}
