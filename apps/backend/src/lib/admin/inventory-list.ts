export type InventoryStockStatus =
  | "in_stock"
  | "low_stock"
  | "critical"
  | "out_of_stock";

export type InventoryListFilters = {
  search?: string;
  brand?: string;
  vehicle?: string;
  stockStatus?: string;
};

export const WAREHOUSES = [
  { id: "chennai", name: "Chennai Warehouse", code: "CHN" },
  { id: "bangalore", name: "Bangalore Warehouse", code: "BLR" },
  { id: "mumbai", name: "Mumbai Warehouse", code: "BOM" },
] as const;

export function deriveStockStatus(
  available: number,
  threshold: number
): InventoryStockStatus {
  if (available <= 0) return "out_of_stock";
  const criticalLevel = Math.max(1, Math.floor(threshold * 0.35));
  if (available <= criticalLevel) return "critical";
  if (available <= threshold) return "low_stock";
  return "in_stock";
}

/** Deterministic warehouse split until multi-warehouse schema lands. */
export function splitWarehouseStock(
  stock: number,
  seed: string
): Record<string, number> {
  if (stock <= 0) {
    return { chennai: 0, bangalore: 0, mumbai: 0 };
  }
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % 100;
  const chennaiPct = 0.45 + (h % 15) / 100;
  const bangalorePct = 0.28 + ((h >> 2) % 10) / 100;
  const chennai = Math.floor(stock * chennaiPct);
  const bangalore = Math.floor(stock * bangalorePct);
  const mumbai = Math.max(0, stock - chennai - bangalore);
  return { chennai, bangalore, mumbai };
}

export type WarehouseAllocation = {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
};

export function toWarehouseRows(
  stock: number,
  seed: string
): WarehouseAllocation[] {
  const split = splitWarehouseStock(stock, seed);
  return WAREHOUSES.map((w) => ({
    warehouseId: w.id,
    warehouseName: w.name,
    quantity: split[w.id] ?? 0,
  }));
}
