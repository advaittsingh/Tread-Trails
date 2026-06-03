import { z } from "zod";
import type { InventoryMovementType } from "@prisma/client";

export const stockActionSchema = z.object({
  quantity: z.number().int().min(1).max(1_000_000),
  note: z.string().max(2000).optional().default(""),
});

export const adjustStockSchema = z.object({
  quantity: z.number().int().min(0).max(1_000_000),
  note: z.string().max(2000).optional().default(""),
});

export const transferStockSchema = z.object({
  fromProductId: z.string().cuid(),
  toProductId: z.string().cuid(),
  quantity: z.number().int().min(1).max(1_000_000),
  note: z.string().max(2000).optional().default(""),
});

export const patchInventorySchema = z.object({
  sku: z.string().min(1).max(64).optional(),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).optional(),
  reservedQuantity: z.number().int().min(0).max(1_000_000).optional(),
  incomingQuantity: z.number().int().min(0).max(1_000_000).optional(),
});

export const inventorySettingsSchema = z.object({
  defaultLowStockThreshold: z.number().int().min(0).max(1_000_000),
});

export const bulkInventoryRowSchema = z.object({
  sku: z.string().min(1).max(64),
  stockQuantity: z.number().int().min(0).max(1_000_000).optional(),
  reservedQuantity: z.number().int().min(0).max(1_000_000).optional(),
  incomingQuantity: z.number().int().min(0).max(1_000_000).optional(),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).optional(),
});

export const bulkInventorySchema = z.object({
  rows: z.array(bulkInventoryRowSchema).min(1).max(500),
});

export const MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  manual_add: "Manual Adjustment",
  manual_remove: "Manual Adjustment",
  adjustment: "Stock Adjustment",
  transfer_out: "Transfer Out",
  transfer_in: "Transfer In",
  customer_order: "Customer Order",
  purchase_order: "Purchase Order",
  damaged: "Damaged Goods",
  incoming: "Incoming Stock",
};

export function movementDisplayLabel(type: InventoryMovementType): string {
  return MOVEMENT_LABELS[type] ?? type;
}

export function movementSignedQuantity(
  type: InventoryMovementType,
  quantity: number
): string {
  const abs = Math.abs(quantity);
  const positiveTypes: InventoryMovementType[] = [
    "manual_add",
    "transfer_in",
    "purchase_order",
    "incoming",
  ];
  const prefix = positiveTypes.includes(type) ? "+" : "-";
  if (type === "adjustment") {
    return quantity >= 0 ? `+${quantity}` : `${quantity}`;
  }
  return `${prefix}${abs}`;
}
