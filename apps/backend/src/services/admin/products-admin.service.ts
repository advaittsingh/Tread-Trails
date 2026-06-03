import type { Prisma } from "@prisma/client";

import {
  prismaProductToDTO,
  productWithVehicleCompatInclude,
  type ProductWithVehicleCompat,
} from "../../lib/catalog/map-product.js";
import {
  type AdminProductListRow,
  derivePublicationStatus,
  deriveStockStatus,
  type ProductListFilters,
} from "../../lib/admin/product-list.js";
import { availableQuantity, skuFromProduct } from "./inventory.service.js";
import { prisma } from "../../lib/prisma.js";

const listInclude = {
  vehicleCompatibilities: {
    include: { vehicle: { select: { slug: true, name: true } } },
  },
  inventory: true,
} satisfies Prisma.ProductInclude;

type ProductListRow = Prisma.ProductGetPayload<{ include: typeof listInclude }>;

export async function getProductsSummary() {
  const [
    totalProducts,
    withCompat,
    inventoryRows,
    allProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: { vehicleCompatibilities: { some: {} } },
    }),
    prisma.productInventory.findMany({
      include: { product: { select: { price: true } } },
    }),
    prisma.product.findMany({
      select: { price: true, images: true },
    }),
  ]);

  let outOfStock = 0;
  let lowStock = 0;
  let inventoryValue = 0;

  const inventoriedProductIds = new Set(inventoryRows.map((r) => r.productId));

  for (const row of inventoryRows) {
    const available = availableQuantity(row.stockQuantity, row.reservedQuantity);
    inventoryValue += row.stockQuantity * (row.product.price ?? 0);
    if (available <= 0) outOfStock += 1;
    else if (available <= row.lowStockThreshold) lowStock += 1;
  }

  const withoutInventory = totalProducts - inventoriedProductIds.size;
  outOfStock += withoutInventory;

  let activeProducts = 0;
  let draftProducts = 0;
  for (const p of allProducts) {
    const status = derivePublicationStatus({
      price: p.price,
      images: p.images,
    });
    if (status === "active") activeProducts += 1;
    else draftProducts += 1;
  }

  return {
    totalProducts,
    activeProducts,
    draftProducts,
    outOfStock,
    lowStock,
    missingCompatibility: Math.max(0, totalProducts - withCompat),
    inventoryValue,
    compatibilityCoveragePercent:
      totalProducts > 0
        ? Math.round((withCompat / totalProducts) * 1000) / 10
        : 0,
  };
}

export async function buildProductsWhere(
  filters: ProductListFilters
): Promise<Prisma.ProductWhereInput> {
  const and: Prisma.ProductWhereInput[] = [];

  const search = filters.search?.trim();
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const sku = filters.sku?.trim();
  if (sku) {
    and.push({
      OR: [
        { legacyId: { contains: sku, mode: "insensitive" } },
        { slug: { contains: sku, mode: "insensitive" } },
        {
          inventory: {
            is: { sku: { contains: sku, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  const brand = filters.brand?.trim();
  if (brand) {
    and.push({ brand: { contains: brand, mode: "insensitive" } });
  }

  const category = filters.category?.trim();
  if (category) {
    and.push({ category: { contains: category, mode: "insensitive" } });
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

  const publicationStatus = filters.publicationStatus?.trim();
  if (publicationStatus === "active") {
    and.push({ price: { not: null }, images: { isEmpty: false } });
  } else if (publicationStatus === "draft") {
    and.push({
      OR: [{ price: null }, { images: { isEmpty: true } }],
    });
  }

  const stockStatus = filters.stockStatus?.trim();
  if (stockStatus === "out_of_stock") {
    and.push({
      OR: [
        { inventory: { is: { stockQuantity: { lte: 0 } } } },
        { inventory: null },
      ],
    });
  } else if (stockStatus === "low_stock") {
    and.push({
      inventory: {
        is: {
          stockQuantity: { gt: 0 },
        },
      },
    });
  } else if (stockStatus === "in_stock") {
    and.push({
      inventory: {
        is: {
          stockQuantity: { gt: 0 },
        },
      },
    });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0]!;
  return { AND: and };
}

function mapRow(p: ProductListRow): AdminProductListRow {
  const dto = prismaProductToDTO(p as ProductWithVehicleCompat);
  const vehicles = p.vehicleCompatibilities
    .map((c) => c.vehicle.name)
    .sort();

  const inv = p.inventory;
  const hasInventory = Boolean(inv);
  const stock = inv?.stockQuantity ?? 0;
  const reserved = inv?.reservedQuantity ?? 0;
  const available = hasInventory
    ? availableQuantity(stock, reserved)
    : 0;
  const threshold = inv?.lowStockThreshold ?? 5;
  const stockStatus = deriveStockStatus({
    hasInventory,
    available,
    threshold,
  });

  const publicationStatus = derivePublicationStatus({
    price: p.price,
    images: p.images,
  });

  const price = p.price ?? 0;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: inv?.sku ?? skuFromProduct(p.slug, p.legacyId),
    brand: p.brand,
    category: p.category,
    thumbnail: p.images[0] ?? null,
    compatibleVehicles: vehicles,
    compatibleVehicleCount: vehicles.length,
    stock,
    available,
    reserved,
    incoming: inv?.incomingQuantity ?? 0,
    lowStockThreshold: threshold,
    stockStatus,
    sellingPrice: p.price,
    currency: p.currency,
    publicationStatus,
    hasCompatibility: vehicles.length > 0,
    inventoryValue: stock * price,
    reorderAlert:
      stockStatus === "low_stock" || stockStatus === "out_of_stock",
    product: dto,
  };
}

export async function listAdminProducts(
  where: Prisma.ProductWhereInput,
  skip: number,
  take: number,
  stockStatusFilter?: string
) {
  if (stockStatusFilter === "low_stock") {
    const all = await prisma.product.findMany({
      where,
      include: listInclude,
      orderBy: { updatedAt: "desc" },
    });
    const filtered = all.filter((p) => {
      if (!p.inventory) return false;
      const available = availableQuantity(
        p.inventory.stockQuantity,
        p.inventory.reservedQuantity
      );
      return (
        available > 0 && available <= p.inventory.lowStockThreshold
      );
    });
    const page = filtered.slice(skip, skip + take);
    return {
      products: page.map(mapRow),
      total: filtered.length,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: listInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(mapRow),
    total,
  };
}

export async function getAdminProductDetailBundle(productId: string) {
  const row = await prisma.product.findUnique({
    where: { id: productId },
    include: listInclude,
  });
  if (!row) return null;

  const seoPath = `/products/${row.slug}`;
  const seoRoute = await prisma.seoRoute.findUnique({
    where: { path: seoPath },
  });

  const listRow = mapRow(row);

  return {
    id: row.id,
    list: listRow,
    product: prismaProductToDTO(row as ProductWithVehicleCompat),
    seo: seoRoute
      ? {
          path: seoRoute.path,
          metaTitle: seoRoute.metaTitle,
          metaDescription: seoRoute.metaDescription,
          canonicalUrl: seoRoute.canonicalUrl,
          ogImageUrl: seoRoute.ogImageUrl,
          robots: seoRoute.robots,
        }
      : null,
    vehicleSlugs: row.vehicleCompatibilities.map((c) => c.vehicle.slug).sort(),
  };
}

export function productsToCsv(rows: AdminProductListRow[]): string {
  const header = [
    "ID",
    "SKU",
    "Name",
    "Brand",
    "Category",
    "Price",
    "Stock",
    "Available",
    "Status",
    "Publication",
    "Vehicles",
  ];
  const lines = rows.map((p) =>
    [
      p.id,
      p.sku,
      p.name,
      p.brand,
      p.category,
      p.sellingPrice ?? "",
      p.stock,
      p.available,
      p.stockStatus,
      p.publicationStatus,
      p.compatibleVehicles.join("; "),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
