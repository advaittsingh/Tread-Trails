import type { Prisma } from "@prisma/client";

import {
  deriveStockStatus,
  type InventoryListFilters,
  type InventoryStockStatus,
  toWarehouseRows,
  WAREHOUSES,
} from "../../lib/admin/inventory-list.js";
import {
  availableQuantity,
  backfillMissingInventory,
  ensureProductInventory,
  getInventoryDashboard,
  mapInventoryItem,
  mapMovementRow,
} from "./inventory.service.js";
import { prisma } from "../../lib/prisma.js";

const listInclude = {
  inventory: true,
  vehicleCompatibilities: {
    include: { vehicle: { select: { slug: true, name: true } } },
  },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof listInclude }>;

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
  warehouseAllocation: ReturnType<typeof toWarehouseRows>;
};

function reorderSuggestion(available: number, threshold: number, incoming: number) {
  const min = threshold;
  const target = Math.max(threshold * 2, min + 5);
  const suggested = Math.max(0, target - available - incoming);
  return { suggested, required: available <= threshold };
}

export async function mapToInventoryListRow(p: ProductRow): Promise<AdminInventoryListRow> {
  const inv =
    p.inventory ?? (await ensureProductInventory(p.id));
  const mapped = mapInventoryItem(p, inv);
  const available = mapped.availableQuantity;
  const stockStatus = deriveStockStatus(available, inv.lowStockThreshold);
  const { suggested, required } = reorderSuggestion(
    available,
    inv.lowStockThreshold,
    inv.incomingQuantity
  );

  const damagedAgg = await prisma.inventoryMovement.aggregate({
    where: { productId: p.id, type: "damaged" },
    _sum: { quantity: true },
  });

  const vehicles = p.vehicleCompatibilities
    .map((c) => c.vehicle.name)
    .sort();

  return {
    productId: p.id,
    name: p.name,
    slug: p.slug,
    sku: mapped.sku,
    brand: p.brand,
    category: p.category,
    thumbnail: p.images[0] ?? null,
    compatibleVehicles: vehicles,
    stockQuantity: inv.stockQuantity,
    availableQuantity: available,
    reservedQuantity: inv.reservedQuantity,
    incomingQuantity: inv.incomingQuantity,
    damagedQuantity: damagedAgg._sum.quantity ?? 0,
    lowStockThreshold: inv.lowStockThreshold,
    reorderLevel: inv.lowStockThreshold,
    stockStatus,
    price: p.price,
    inventoryValue: inv.stockQuantity * (p.price ?? 0),
    reorderRequired: required,
    suggestedReorderQty: suggested,
    warehouseAllocation: toWarehouseRows(inv.stockQuantity, p.id),
  };
}

export async function getInventorySummary() {
  await backfillMissingInventory();
  const dash = await getInventoryDashboard();

  const allInv = await prisma.productInventory.findMany({
    include: { product: { select: { price: true } } },
  });

  let criticalCount = 0;
  let reorderRequired = 0;
  let healthyCount = 0;

  for (const row of allInv) {
    const available = availableQuantity(
      row.stockQuantity,
      row.reservedQuantity
    );
    const status = deriveStockStatus(available, row.lowStockThreshold);
    if (status === "in_stock") healthyCount += 1;
    if (status === "critical") criticalCount += 1;
    const { required } = reorderSuggestion(
      available,
      row.lowStockThreshold,
      row.incomingQuantity
    );
    if (required) reorderRequired += 1;
  }

  const totalSkus = allInv.length;
  const healthPercent =
    totalSkus > 0 ? Math.round((healthyCount / totalSkus) * 1000) / 10 : 100;

  const warehouseSummary = WAREHOUSES.map((w) => {
    let skuCount = 0;
    let units = 0;
    for (const row of allInv) {
      const split = toWarehouseRows(row.stockQuantity, row.productId);
      const qty = split.find((s) => s.warehouseId === w.id)?.quantity ?? 0;
      if (qty > 0) {
        skuCount += 1;
        units += qty;
      }
    }
    return {
      warehouseId: w.id,
      warehouseName: w.name,
      skuCount,
      units,
    };
  });

  const missingCompat = await prisma.product.count({
    where: { vehicleCompatibilities: { none: {} } },
  });

  return {
    totalSkus,
    inventoryValue: dash.inventoryValue,
    lowStock: dash.lowStockCount,
    outOfStock: dash.outOfStockCount,
    incomingStock: dash.incomingStock,
    reorderRequired,
    criticalCount,
    healthPercent,
    healthyCount,
    warehouseSummary,
    missingCompatibility: missingCompat,
    alerts: dash.alerts,
  };
}

export async function buildInventoryWhere(
  filters: InventoryListFilters
): Promise<Prisma.ProductWhereInput> {
  const and: Prisma.ProductWhereInput[] = [];

  const search = filters.search?.trim();
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { inventory: { is: { sku: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  const brand = filters.brand?.trim();
  if (brand) {
    and.push({ brand: { contains: brand, mode: "insensitive" } });
  }

  const vehicle = filters.vehicle?.trim();
  if (vehicle) {
    and.push({
      vehicleCompatibilities: {
        some: {
          vehicle: {
            OR: [
              { name: { contains: vehicle, mode: "insensitive" } },
              { slug: { contains: vehicle, mode: "insensitive" } },
            ],
          },
        },
      },
    });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0]!;
  return { AND: and };
}

export async function listAdminInventory(
  where: Prisma.ProductWhereInput,
  skip: number,
  take: number,
  stockStatusFilter?: string
) {
  await backfillMissingInventory();

  const products = await prisma.product.findMany({
    where,
    include: listInclude,
    orderBy: { name: "asc" },
  });

  let rows = await Promise.all(products.map(mapToInventoryListRow));

  if (stockStatusFilter && stockStatusFilter !== "all") {
    rows = rows.filter((r) => r.stockStatus === stockStatusFilter);
  }

  const total = rows.length;
  const page = rows.slice(skip, skip + take);

  return { items: page, total };
}

export async function getInventoryProductBundle(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: listInclude,
  });
  if (!product) return null;

  const list = await mapToInventoryListRow(product);

  const movements = await prisma.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      product: { select: { name: true, slug: true } },
      admin: { select: { name: true } },
      inventory: { select: { sku: true } },
    },
  });

  return {
    item: list,
    movements: movements.map(mapMovementRow),
    warehouseAllocation: list.warehouseAllocation,
    compatibleVehicles: list.compatibleVehicles,
  };
}

export async function getReorderSuggestions(limit = 25) {
  const products = await prisma.product.findMany({
    include: listInclude,
    take: 200,
  });

  const rows = await Promise.all(products.map(mapToInventoryListRow));
  return rows
    .filter((r) => r.reorderRequired && r.suggestedReorderQty > 0)
    .sort((a, b) => a.availableQuantity - b.availableQuantity)
    .slice(0, limit)
    .map((r) => ({
      productId: r.productId,
      name: r.name,
      sku: r.sku,
      brand: r.brand,
      supplier: r.brand,
      current: r.availableQuantity,
      min: r.reorderLevel,
      suggested: r.suggestedReorderQty,
      leadTimeDays: 14,
    }));
}

export async function getPurchaseOrdersList() {
  const rows: Array<{
    id: string;
    poNumber: string;
    supplier: string;
    items: number;
    amount: number;
    status: string;
    eta: string;
  }> = [];

  const incomingProducts = await prisma.product.findMany({
    include: { inventory: true },
    where: { inventory: { is: { incomingQuantity: { gt: 0 } } } },
  });

  for (const p of incomingProducts) {
    const inv = p.inventory!;
    rows.push({
      id: `po-${p.id}`,
      poNumber: `PO-${inv.sku}`,
      supplier: p.brand,
      items: 1,
      amount: (p.price ?? 0) * inv.incomingQuantity,
      status: "pending",
      eta: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    });
  }

  const poMovements = await prisma.inventoryMovement.findMany({
    where: { type: "purchase_order" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      product: { select: { brand: true, price: true } },
      inventory: { select: { sku: true, incomingQuantity: true } },
    },
  });

  for (const m of poMovements) {
    if (rows.some((r) => r.poNumber === `PO-${m.inventory.sku}`)) continue;
    rows.push({
      id: m.id,
      poNumber: m.referenceId ?? `PO-${m.inventory.sku}`,
      supplier: m.product.brand,
      items: 1,
      amount: (m.product.price ?? 0) * m.quantity,
      status: "received",
      eta: m.createdAt.toISOString().slice(0, 10),
    });
  }

  return rows.slice(0, 30);
}

export async function getInventoryInsights() {
  const vehicleRows = await prisma.productVehicleCompatibility.groupBy({
    by: ["vehicleId"],
    _count: { productId: true },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleRows.map((v) => v.vehicleId) } },
    select: { id: true, name: true, slug: true },
  });
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  const topVehicleDemand = vehicleRows
    .map((v) => ({
      vehicleName: vehicleById.get(v.vehicleId)?.name ?? "Unknown",
      vehicleSlug: vehicleById.get(v.vehicleId)?.slug ?? "",
      productCount: v._count.productId,
    }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 8);

  const [totalProducts, withCompat] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: { vehicleCompatibilities: { some: {} } },
    }),
  ]);

  return {
    topVehicleDemand,
    compatibilityCoveragePercent:
      totalProducts > 0
        ? Math.round((withCompat / totalProducts) * 1000) / 10
        : 0,
    productsMissingFitment: totalProducts - withCompat,
  };
}

export function inventoryListToCsv(rows: AdminInventoryListRow[]): string {
  const header = [
    "SKU",
    "Product",
    "Brand",
    "Available",
    "Reserved",
    "Incoming",
    "Reorder Level",
    "Status",
    "Vehicles",
  ];
  const lines = rows.map((r) =>
    [
      r.sku,
      r.name,
      r.brand,
      r.availableQuantity,
      r.reservedQuantity,
      r.incomingQuantity,
      r.reorderLevel,
      r.stockStatus,
      r.compatibleVehicles.join("; "),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
