import type {
  AdminInventoryListRow,
  InventoryInsights,
  InventoryListResponse,
  InventoryMovement,
  InventoryProductBundle,
  InventorySummary,
  PurchaseOrderRow,
  ReorderSuggestion,
} from "./types";

const warehouses = [
  { warehouseId: "chennai", warehouseName: "Chennai Warehouse", quantity: 4 },
  { warehouseId: "bangalore", warehouseName: "Bangalore Warehouse", quantity: 2 },
  { warehouseId: "mumbai", warehouseName: "Mumbai Warehouse", quantity: 2 },
];

const sampleItem: AdminInventoryListRow = {
  productId: "inv_mock_1",
  name: "ARB Twin Compressor",
  slug: "arb-twin-compressor",
  sku: "ARB-001",
  brand: "ARB",
  category: "Air Systems",
  thumbnail: null,
  compatibleVehicles: ["Mahindra Thar", "Toyota Hilux", "Jimny"],
  stockQuantity: 8,
  availableQuantity: 8,
  reservedQuantity: 2,
  incomingQuantity: 20,
  damagedQuantity: 0,
  lowStockThreshold: 10,
  reorderLevel: 10,
  stockStatus: "low_stock",
  price: 48500,
  inventoryValue: 388000,
  reorderRequired: true,
  suggestedReorderQty: 20,
  warehouseAllocation: warehouses,
};

export const mockInventorySummary: InventorySummary = {
  totalSkus: 1450,
  inventoryValue: 3_450_000,
  lowStock: 18,
  outOfStock: 5,
  incomingStock: 120,
  reorderRequired: 22,
  criticalCount: 5,
  healthPercent: 89,
  healthyCount: 1290,
  warehouseSummary: [
    { warehouseId: "chennai", warehouseName: "Chennai Warehouse", skuCount: 1250, units: 4200 },
    { warehouseId: "bangalore", warehouseName: "Bangalore Warehouse", skuCount: 950, units: 3100 },
    { warehouseId: "mumbai", warehouseName: "Mumbai Warehouse", skuCount: 600, units: 1800 },
  ],
  missingCompatibility: 70,
  alerts: [
    {
      productId: "inv_mock_1",
      name: "ARB Twin Compressor",
      sku: "ARB-001",
      available: 8,
      threshold: 10,
    },
  ],
};

export const mockInventoryList: InventoryListResponse = {
  items: [
    sampleItem,
    {
      ...sampleItem,
      productId: "inv_mock_2",
      name: "Ironman Foam Cell Pro",
      sku: "IRM-FC-001",
      brand: "Ironman",
      stockStatus: "critical",
      availableQuantity: 2,
      stockQuantity: 2,
      reorderRequired: true,
      suggestedReorderQty: 18,
    },
    {
      ...sampleItem,
      productId: "inv_mock_3",
      name: "BMC Air Filter — Thar",
      sku: "BMC-THAR-01",
      brand: "BMC",
      stockStatus: "in_stock",
      availableQuantity: 45,
      stockQuantity: 45,
      reorderRequired: false,
    },
    {
      ...sampleItem,
      productId: "inv_mock_4",
      name: "Hamer Bull Bar",
      sku: "HAM-BB-001",
      brand: "Hamer",
      stockStatus: "out_of_stock",
      availableQuantity: 0,
      stockQuantity: 0,
      incomingQuantity: 6,
    },
  ],
  total: 4,
  page: 1,
  limit: 25,
  totalPages: 1,
};

export const mockInventoryBundle: InventoryProductBundle = {
  item: sampleItem,
  movements: [
    {
      id: "mov_1",
      type: "purchase_order",
      label: "Purchase Order",
      signedQuantity: "+10",
      quantity: 10,
      note: "PO-2026-042",
      referenceId: "PO-2026-042",
      productId: sampleItem.productId,
      productName: sampleItem.name,
      sku: sampleItem.sku,
      adminName: "Admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mov_2",
      type: "order_deduct",
      label: "Customer Order",
      signedQuantity: "-2",
      quantity: 2,
      note: "Order TT-1042",
      referenceId: "TT-1042",
      productId: sampleItem.productId,
      productName: sampleItem.name,
      sku: sampleItem.sku,
      adminName: null,
      createdAt: new Date().toISOString(),
    },
  ],
  warehouseAllocation: warehouses,
  compatibleVehicles: sampleItem.compatibleVehicles,
};

export const mockReorderSuggestions: ReorderSuggestion[] = [
  {
    productId: sampleItem.productId,
    name: sampleItem.name,
    sku: sampleItem.sku,
    brand: sampleItem.brand,
    supplier: "ARB Australia",
    current: 2,
    min: 10,
    suggested: 20,
    leadTimeDays: 21,
  },
];

export const mockPurchaseOrders: PurchaseOrderRow[] = [
  {
    id: "po_1",
    poNumber: "PO-ARB-001",
    supplier: "ARB",
    items: 1,
    amount: 970000,
    status: "pending",
    eta: "2026-06-20",
  },
  {
    id: "po_2",
    poNumber: "PO-IRM-FC-001",
    supplier: "Ironman",
    items: 3,
    amount: 245000,
    status: "in_transit",
    eta: "2026-06-12",
  },
];

export const mockInventoryInsights: InventoryInsights = {
  topVehicleDemand: [
    { vehicleName: "Mahindra Thar", vehicleSlug: "mahindra-thar", productCount: 320 },
    { vehicleName: "Scorpio N", vehicleSlug: "scorpio-n", productCount: 240 },
    { vehicleName: "Toyota Hilux", vehicleSlug: "toyota-hilux", productCount: 180 },
    { vehicleName: "Jimny", vehicleSlug: "suzuki-jimny", productCount: 145 },
  ],
  compatibilityCoveragePercent: 95.2,
  productsMissingFitment: 70,
};

export const mockMovements: InventoryMovement[] = mockInventoryBundle.movements;
