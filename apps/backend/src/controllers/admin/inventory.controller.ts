import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  adjustStockSchema,
  bulkInventorySchema,
  inventorySettingsSchema,
  patchInventorySchema,
  stockActionSchema,
  transferStockSchema,
} from "../../lib/validators/admin-inventory.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import {
  addStock,
  adjustStock,
  backfillMissingInventory,
  bulkUpdateInventory,
  ensureProductInventory,
  getInventoryDashboard,
  getInventorySettings,
  inventoryToCsv,
  mapInventoryItem,
  mapMovementRow,
  parseInventoryCsv,
  patchProductInventory,
  removeStock,
  transferStock,
} from "../../services/admin/inventory.service.js";
import { adminId, pagination, validationError } from "./utils.js";

export async function getInventoryDashboardHandler(_req: Request, res: Response) {
  try {
    const dashboard = await getInventoryDashboard();
    const settings = await getInventorySettings();
    return res.json({ ...dashboard, defaultLowStockThreshold: settings.defaultLowStockThreshold });
  } catch (e) {
    console.error("[admin/inventory] dashboard failed", e);
    return res.status(500).json({ error: "Failed to load inventory dashboard" });
  }
}

export async function listInventory(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();
  const filter = String(req.query.filter ?? "").trim();

  try {
    await backfillMissingInventory();

    const where: Prisma.ProductWhereInput = {};
    const clauses: Prisma.ProductWhereInput[] = [];

    if (search) {
      clauses.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { inventory: { sku: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    if (clauses.length === 1) {
      Object.assign(where, clauses[0]);
    } else if (clauses.length > 1) {
      where.AND = clauses;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { inventory: true },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const items = await Promise.all(
      products.map(async (p) => {
        const inv = p.inventory ?? (await ensureProductInventory(p.id));
        return mapInventoryItem(p, inv);
      })
    );

    let filteredItems = items;
    if (filter === "low") {
      filteredItems = items.filter((i) => i.isLowStock);
    } else if (filter === "out") {
      filteredItems = items.filter((i) => i.isOutOfStock);
    }

    return res.json({
      items: filteredItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("[admin/inventory] list failed", e);
    return res.status(500).json({ error: "Failed to load inventory" });
  }
}

export async function listInventoryMovements(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const productId = String(req.query.productId ?? "").trim();
  const from = String(req.query.from ?? "").trim();
  const to = String(req.query.to ?? "").trim();

  const where: Prisma.InventoryMovementWhereInput = {};
  if (productId) where.productId = productId;
  if (from || to) {
    where.createdAt = {};
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const end = new Date(`${to}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      where.createdAt.lt = end;
    }
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: { select: { name: true, slug: true } },
          admin: { select: { name: true } },
          inventory: { select: { sku: true } },
        },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return res.json({
      movements: rows.map(mapMovementRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("[admin/inventory] movements failed", e);
    return res.status(500).json({ error: "Failed to load inventory history" });
  }
}

export async function getInventorySettingsHandler(_req: Request, res: Response) {
  try {
    const settings = await getInventorySettings();
    return res.json({
      defaultLowStockThreshold: settings.defaultLowStockThreshold,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load settings" });
  }
}

export async function patchInventorySettings(req: AuthedRequest, res: Response) {
  const parsed = inventorySettingsSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const settings = await prisma.inventorySettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        defaultLowStockThreshold: parsed.data.defaultLowStockThreshold,
      },
      update: {
        defaultLowStockThreshold: parsed.data.defaultLowStockThreshold,
      },
    });
    return res.json({
      defaultLowStockThreshold: settings.defaultLowStockThreshold,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to update settings" });
  }
}

export async function patchInventoryItem(req: AuthedRequest, res: Response) {
  const productId = req.params.productId as string;
  const parsed = patchInventorySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const updated = await patchProductInventory(
      productId,
      parsed.data,
      adminId(req)
    );
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { id: true, name: true, slug: true, brand: true, price: true },
    });
    return res.json({ item: mapInventoryItem(product, updated) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function addStockHandler(req: AuthedRequest, res: Response) {
  const productId = req.params.productId as string;
  const parsed = stockActionSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await addStock(
      productId,
      parsed.data.quantity,
      parsed.data.note,
      adminId(req)
    );
    return res.json({ ok: true, stockQuantity: result.inventory.stockQuantity });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Add stock failed" });
  }
}

export async function removeStockHandler(req: AuthedRequest, res: Response) {
  const productId = req.params.productId as string;
  const parsed = stockActionSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const type =
    parsed.data.note.toLowerCase().includes("damage") ? "damaged" : "manual_remove";

  try {
    const result = await removeStock(
      productId,
      parsed.data.quantity,
      parsed.data.note,
      adminId(req),
      type
    );
    return res.json({ ok: true, stockQuantity: result.inventory.stockQuantity });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Remove stock failed" });
  }
}

export async function adjustStockHandler(req: AuthedRequest, res: Response) {
  const productId = req.params.productId as string;
  const parsed = adjustStockSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await adjustStock(
      productId,
      parsed.data.quantity,
      parsed.data.note,
      adminId(req)
    );
    return res.json({ ok: true, stockQuantity: result.inventory.stockQuantity });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Adjust stock failed" });
  }
}

export async function transferStockHandler(req: AuthedRequest, res: Response) {
  const parsed = transferStockSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    await transferStock(
      parsed.data.fromProductId,
      parsed.data.toProductId,
      parsed.data.quantity,
      parsed.data.note,
      adminId(req)
    );
    return res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Transfer failed";
    const status = msg.includes("Insufficient") ? 400 : 500;
    return res.status(status).json({ error: msg });
  }
}

export async function purchaseOrderStock(req: AuthedRequest, res: Response) {
  const productId = req.params.productId as string;
  const parsed = stockActionSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await addStock(
      productId,
      parsed.data.quantity,
      parsed.data.note || "Purchase order received",
      adminId(req),
      "purchase_order"
    );
    return res.json({ ok: true, stockQuantity: result.inventory.stockQuantity });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Purchase order failed" });
  }
}

export async function exportInventory(_req: Request, res: Response) {
  try {
    await backfillMissingInventory();
    const products = await prisma.product.findMany({
      include: { inventory: true },
      orderBy: { name: "asc" },
    });

    const items = await Promise.all(
      products.map(async (p) => {
        const inv = p.inventory ?? (await ensureProductInventory(p.id));
        const mapped = mapInventoryItem(p, inv);
        return {
          sku: mapped.sku,
          name: mapped.name,
          stockQuantity: mapped.stockQuantity,
          reservedQuantity: mapped.reservedQuantity,
          incomingQuantity: mapped.incomingQuantity,
          availableQuantity: mapped.availableQuantity,
          lowStockThreshold: mapped.lowStockThreshold,
          price: mapped.price,
        };
      })
    );

    const csv = inventoryToCsv(items);
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader(
      "content-disposition",
      'attachment; filename="inventory-export.csv"'
    );
    return res.send(csv);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Export failed" });
  }
}

export async function importInventory(req: AuthedRequest, res: Response) {
  const csvText =
    typeof req.body?.csv === "string"
      ? req.body.csv
      : typeof req.body === "string"
        ? req.body
        : "";

  if (!csvText.trim()) {
    return res.status(400).json({ error: "Missing CSV body (csv field)" });
  }

  try {
    const rows = parseInventoryCsv(csvText);
    const parsed = bulkInventorySchema.safeParse({ rows });
    if (!parsed.success) return validationError(res, parsed.error);

    const result = await bulkUpdateInventory(parsed.data.rows, adminId(req));
    return res.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    return res.status(400).json({ error: msg });
  }
}

export async function bulkInventoryUpdate(req: AuthedRequest, res: Response) {
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
