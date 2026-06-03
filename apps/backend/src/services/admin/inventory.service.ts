import type { InventoryMovementType, Prisma } from "@prisma/client";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { extractChange } from "../../lib/admin/audit-diff.js";
import {
  movementDisplayLabel,
  movementSignedQuantity,
} from "../../lib/validators/admin-inventory.js";
import { prisma } from "../../lib/prisma.js";

type Tx = Prisma.TransactionClient;

export function availableQuantity(
  stock: number,
  reserved: number
): number {
  return Math.max(0, stock - reserved);
}

export function skuFromProduct(slug: string, legacyId: string | null): string {
  const base = (legacyId ?? slug).toUpperCase().replace(/[^A-Z0-9-]/g, "-");
  return `TT-${base}`.slice(0, 64);
}

export async function getInventorySettings() {
  const row = await prisma.inventorySettings.upsert({
    where: { id: "default" },
    create: { id: "default", defaultLowStockThreshold: 5 },
    update: {},
  });
  return row;
}

export async function ensureProductInventory(
  productId: string,
  tx: Tx = prisma
) {
  const existing = await tx.productInventory.findUnique({
    where: { productId },
  });
  if (existing) return existing;

  const product = await tx.product.findUniqueOrThrow({
    where: { id: productId },
    select: { slug: true, legacyId: true },
  });

  const settings = await getInventorySettings();
  let sku = skuFromProduct(product.slug, product.legacyId);
  let suffix = 0;
  while (await tx.productInventory.findUnique({ where: { sku } })) {
    suffix += 1;
    sku = `${skuFromProduct(product.slug, product.legacyId)}-${suffix}`.slice(
      0,
      64
    );
  }

  return tx.productInventory.create({
    data: {
      productId,
      sku,
      lowStockThreshold: settings.defaultLowStockThreshold,
    },
  });
}

export async function backfillMissingInventory() {
  const products = await prisma.product.findMany({
    where: { inventory: null },
    select: { id: true },
  });
  for (const p of products) {
    await ensureProductInventory(p.id);
  }
}

async function recordMovement(
  tx: Tx,
  input: {
    productId: string;
    inventoryId: string;
    type: InventoryMovementType;
    quantity: number;
    quantityBefore: number;
    quantityAfter: number;
    note?: string;
    referenceId?: string;
    adminId?: string;
  }
) {
  return tx.inventoryMovement.create({
    data: {
      productId: input.productId,
      inventoryId: input.inventoryId,
      type: input.type,
      quantity: input.quantity,
      quantityBefore: input.quantityBefore,
      quantityAfter: input.quantityAfter,
      note: input.note ?? "",
      referenceId: input.referenceId ?? null,
      adminId: input.adminId ?? null,
    },
    include: {
      product: { select: { name: true, slug: true } },
      admin: { select: { name: true } },
    },
  });
}

export function mapMovementRow(row: {
  id: string;
  type: InventoryMovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  note: string;
  referenceId: string | null;
  productId: string;
  createdAt: Date;
  product: { name: string; slug: string };
  admin: { name: string } | null;
  inventory: { sku: string };
}) {
  return {
    id: row.id,
    type: row.type,
    label: movementDisplayLabel(row.type),
    signedQuantity: movementSignedQuantity(row.type, row.quantity),
    quantity: row.quantity,
    quantityBefore: row.quantityBefore,
    quantityAfter: row.quantityAfter,
    note: row.note,
    referenceId: row.referenceId,
    productId: row.productId,
    productName: row.product.name,
    productSlug: row.product.slug,
    sku: row.inventory.sku,
    adminName: row.admin?.name ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapInventoryItem(
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    price: number | null;
  },
  inv: {
    sku: string;
    stockQuantity: number;
    reservedQuantity: number;
    incomingQuantity: number;
    lowStockThreshold: number;
  }
) {
  const available = availableQuantity(
    inv.stockQuantity,
    inv.reservedQuantity
  );
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    price: product.price,
    sku: inv.sku,
    stockQuantity: inv.stockQuantity,
    reservedQuantity: inv.reservedQuantity,
    incomingQuantity: inv.incomingQuantity,
    availableQuantity: available,
    lowStockThreshold: inv.lowStockThreshold,
    isLowStock: available > 0 && available <= inv.lowStockThreshold,
    isOutOfStock: available <= 0,
  };
}

export async function getInventoryDashboard() {
  await backfillMissingInventory();

  const rows = await prisma.productInventory.findMany({
    include: {
      product: { select: { id: true, name: true, price: true, slug: true } },
    },
  });

  let totalStock = 0;
  let incomingStock = 0;
  let inventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const alerts: Array<{
    productId: string;
    name: string;
    sku: string;
    available: number;
    threshold: number;
  }> = [];

  for (const row of rows) {
    totalStock += row.stockQuantity;
    incomingStock += row.incomingQuantity;
    const available = availableQuantity(
      row.stockQuantity,
      row.reservedQuantity
    );
    if (row.product.price != null) {
      inventoryValue += row.stockQuantity * row.product.price;
    }
    if (available <= 0) {
      outOfStockCount += 1;
    } else if (available <= row.lowStockThreshold) {
      lowStockCount += 1;
      alerts.push({
        productId: row.productId,
        name: row.product.name,
        sku: row.sku,
        available,
        threshold: row.lowStockThreshold,
      });
    }
  }

  alerts.sort((a, b) => a.available - b.available);

  return {
    totalStock,
    lowStockCount,
    outOfStockCount,
    incomingStock,
    inventoryValue,
    alerts: alerts.slice(0, 20),
  };
}

export async function addStock(
  productId: string,
  quantity: number,
  note: string,
  adminId: string,
  type: InventoryMovementType = "manual_add"
) {
  return prisma.$transaction(async (tx) => {
    const inv = await ensureProductInventory(productId, tx);
    const before = inv.stockQuantity;
    const after = before + quantity;
    const updated = await tx.productInventory.update({
      where: { id: inv.id },
      data: { stockQuantity: after },
    });
    const movement = await recordMovement(tx, {
      productId,
      inventoryId: inv.id,
      type,
      quantity,
      quantityBefore: before,
      quantityAfter: after,
      note,
      adminId,
    });
    await logAdminAction({
      adminId,
      action: "inventory.add_stock",
      entity: "inventory",
      entityId: inv.id,
      previousValue: { stockQuantity: before, productId },
      newValue: { stockQuantity: after, productId },
      meta: { quantity, type, note },
    });
    return { inventory: updated, movement };
  });
}

export async function removeStock(
  productId: string,
  quantity: number,
  note: string,
  adminId: string,
  type: InventoryMovementType = "manual_remove"
) {
  return prisma.$transaction(async (tx) => {
    const inv = await ensureProductInventory(productId, tx);
    const before = inv.stockQuantity;
    const after = Math.max(0, before - quantity);
    const updated = await tx.productInventory.update({
      where: { id: inv.id },
      data: { stockQuantity: after },
    });
    const movement = await recordMovement(tx, {
      productId,
      inventoryId: inv.id,
      type,
      quantity: before - after,
      quantityBefore: before,
      quantityAfter: after,
      note,
      adminId,
    });
    await logAdminAction({
      adminId,
      action: "inventory.remove_stock",
      entity: "inventory",
      entityId: inv.id,
      previousValue: { stockQuantity: before, productId },
      newValue: { stockQuantity: after, productId },
      meta: { quantity, type, note },
    });
    return { inventory: updated, movement };
  });
}

export async function adjustStock(
  productId: string,
  newQuantity: number,
  note: string,
  adminId: string
) {
  return prisma.$transaction(async (tx) => {
    const inv = await ensureProductInventory(productId, tx);
    const before = inv.stockQuantity;
    const delta = newQuantity - before;
    const updated = await tx.productInventory.update({
      where: { id: inv.id },
      data: { stockQuantity: newQuantity },
    });
    const movement = await recordMovement(tx, {
      productId,
      inventoryId: inv.id,
      type: "adjustment",
      quantity: delta,
      quantityBefore: before,
      quantityAfter: newQuantity,
      note,
      adminId,
    });
    await logAdminAction({
      adminId,
      action: "inventory.adjust_stock",
      entity: "inventory",
      entityId: inv.id,
      previousValue: { stockQuantity: before, productId },
      newValue: { stockQuantity: newQuantity, productId },
      meta: { note },
    });
    return { inventory: updated, movement };
  });
}

export async function transferStock(
  fromProductId: string,
  toProductId: string,
  quantity: number,
  note: string,
  adminId: string
) {
  if (fromProductId === toProductId) {
    throw new Error("Cannot transfer to the same product");
  }

  return prisma.$transaction(async (tx) => {
    const fromInv = await ensureProductInventory(fromProductId, tx);
    const toInv = await ensureProductInventory(toProductId, tx);

    const fromBefore = fromInv.stockQuantity;
    if (fromBefore < quantity) {
      throw new Error("Insufficient stock to transfer");
    }
    const fromAfter = fromBefore - quantity;
    const toBefore = toInv.stockQuantity;
    const toAfter = toBefore + quantity;

    await tx.productInventory.update({
      where: { id: fromInv.id },
      data: { stockQuantity: fromAfter },
    });
    await tx.productInventory.update({
      where: { id: toInv.id },
      data: { stockQuantity: toAfter },
    });

    const outMovement = await recordMovement(tx, {
      productId: fromProductId,
      inventoryId: fromInv.id,
      type: "transfer_out",
      quantity,
      quantityBefore: fromBefore,
      quantityAfter: fromAfter,
      note,
      referenceId: toProductId,
      adminId,
    });
    const inMovement = await recordMovement(tx, {
      productId: toProductId,
      inventoryId: toInv.id,
      type: "transfer_in",
      quantity,
      quantityBefore: toBefore,
      quantityAfter: toAfter,
      note,
      referenceId: fromProductId,
      adminId,
    });

    await logAdminAction({
      adminId,
      action: "inventory.transfer",
      entity: "inventory",
      entityId: fromInv.id,
      previousValue: {
        fromStock: fromBefore,
        toStock: toBefore,
        fromProductId,
        toProductId,
      },
      newValue: {
        fromStock: fromAfter,
        toStock: toAfter,
        fromProductId,
        toProductId,
      },
      meta: { quantity, note },
    });

    return { outMovement, inMovement };
  });
}

export async function patchProductInventory(
  productId: string,
  data: {
    sku?: string;
    lowStockThreshold?: number;
    reservedQuantity?: number;
    incomingQuantity?: number;
  },
  adminId: string
) {
  return prisma.$transaction(async (tx) => {
    const inv = await ensureProductInventory(productId, tx);
    const change = extractChange(
      {
        sku: inv.sku,
        lowStockThreshold: inv.lowStockThreshold,
        reservedQuantity: inv.reservedQuantity,
        incomingQuantity: inv.incomingQuantity,
      },
      data as Record<string, unknown>
    );
    const updated = await tx.productInventory.update({
      where: { id: inv.id },
      data,
    });
    await logAdminAction({
      adminId,
      action: "inventory.patch",
      entity: "inventory",
      entityId: inv.id,
      previousValue: change?.previousValue ?? null,
      newValue: change?.newValue ?? null,
      meta: { productId },
    });
    return updated;
  });
}

export async function bulkUpdateInventory(
  rows: Array<{
    sku: string;
    stockQuantity?: number;
    reservedQuantity?: number;
    incomingQuantity?: number;
    lowStockThreshold?: number;
  }>,
  adminId: string
) {
  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const inv = await prisma.productInventory.findUnique({
        where: { sku: row.sku },
      });
      if (!inv) {
        errors.push(`SKU not found: ${row.sku}`);
        continue;
      }

      if (row.stockQuantity !== undefined) {
        await adjustStock(
          inv.productId,
          row.stockQuantity,
          "Bulk CSV update",
          adminId
        );
      }

      const patch: {
        reservedQuantity?: number;
        incomingQuantity?: number;
        lowStockThreshold?: number;
      } = {};
      if (row.reservedQuantity !== undefined) {
        patch.reservedQuantity = row.reservedQuantity;
      }
      if (row.incomingQuantity !== undefined) {
        patch.incomingQuantity = row.incomingQuantity;
      }
      if (row.lowStockThreshold !== undefined) {
        patch.lowStockThreshold = row.lowStockThreshold;
      }
      if (Object.keys(patch).length > 0) {
        await patchProductInventory(inv.productId, patch, adminId);
      }
      updated += 1;
    } catch (e) {
      errors.push(
        `${row.sku}: ${e instanceof Error ? e.message : "Update failed"}`
      );
    }
  }

  return { updated, errors };
}

export function inventoryToCsv(
  items: Array<{
    sku: string;
    name: string;
    stockQuantity: number;
    reservedQuantity: number;
    incomingQuantity: number;
    availableQuantity: number;
    lowStockThreshold: number;
    price: number | null;
  }>
): string {
  const header =
    "sku,productName,stockQuantity,reservedQuantity,incomingQuantity,availableQuantity,lowStockThreshold,price";
  const lines = items.map((i) =>
    [
      i.sku,
      `"${i.name.replace(/"/g, '""')}"`,
      i.stockQuantity,
      i.reservedQuantity,
      i.incomingQuantity,
      i.availableQuantity,
      i.lowStockThreshold,
      i.price ?? "",
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

export function parseInventoryCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const skuIdx = header.indexOf("sku");
  const stockIdx = header.indexOf("stockquantity");
  const reservedIdx = header.indexOf("reservedquantity");
  const incomingIdx = header.indexOf("incomingquantity");
  const thresholdIdx = header.indexOf("lowstockthreshold");

  if (skuIdx === -1) throw new Error("CSV must include sku column");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const num = (idx: number) => {
      if (idx === -1 || cols[idx] === "") return undefined;
      const n = Number(cols[idx]);
      return Number.isFinite(n) ? Math.trunc(n) : undefined;
    };
    return {
      sku: cols[skuIdx]!,
      stockQuantity: num(stockIdx),
      reservedQuantity: num(reservedIdx),
      incomingQuantity: num(incomingIdx),
      lowStockThreshold: num(thresholdIdx),
    };
  });
}
