export type InventoryStockStatus =
  | "in_stock"
  | "low_stock"
  | "critical"
  | "out_of_stock";

export type WarehouseAllocation = {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
};

export type InventorySummary = {
  totalSkus: number;
  inventoryValue: number;
  lowStock: number;
  outOfStock: number;
  incomingStock: number;
  reorderRequired: number;
  criticalCount: number;
  healthPercent: number;
  healthyCount: number;
  warehouseSummary: Array<{
    warehouseId: string;
    warehouseName: string;
    skuCount: number;
    units: number;
  }>;
  missingCompatibility: number;
  alerts: Array<{
    productId: string;
    name: string;
    sku: string;
    available: number;
    threshold: number;
  }>;
};

export type AdminInventoryListRow = {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  thumbnail: string | null;
  compatibleVehicles: string[];
  stockQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  incomingQuantity: number;
  damagedQuantity: number;
  lowStockThreshold: number;
  reorderLevel: number;
  stockStatus: InventoryStockStatus;
  price: number | null;
  inventoryValue: number;
  reorderRequired: boolean;
  suggestedReorderQty: number;
  warehouseAllocation: WarehouseAllocation[];
};

export type InventoryListResponse = {
  items: AdminInventoryListRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type InventoryFilterParams = {
  search?: string;
  brand?: string;
  vehicle?: string;
  stockStatus?: string;
  page?: number;
  limit?: number;
};

export type InventoryMovement = {
  id: string;
  type: string;
  label: string;
  signedQuantity: string;
  quantity: number;
  note: string;
  referenceId: string | null;
  productId: string;
  productName: string;
  sku: string;
  adminName: string | null;
  createdAt: string;
};

export type InventoryProductBundle = {
  item: AdminInventoryListRow;
  movements: InventoryMovement[];
  warehouseAllocation: WarehouseAllocation[];
  compatibleVehicles: string[];
};

export type ReorderSuggestion = {
  productId: string;
  name: string;
  sku: string;
  brand: string;
  supplier: string;
  current: number;
  min: number;
  suggested: number;
  leadTimeDays: number;
};

export type PurchaseOrderRow = {
  id: string;
  poNumber: string;
  supplier: string;
  items: number;
  amount: number;
  status: string;
  eta: string;
};

export type InventoryInsights = {
  topVehicleDemand: Array<{
    vehicleName: string;
    vehicleSlug: string;
    productCount: number;
  }>;
  compatibilityCoveragePercent: number;
  productsMissingFitment: number;
};

export type StockAdjustmentReason =
  | "purchase"
  | "damage"
  | "correction"
  | "return"
  | "transfer";
