import type { Product } from "@tread-trails/shared-types";

export type ProductListFilters = {
  search?: string;
  sku?: string;
  brand?: string;
  category?: string;
  vehicle?: string;
  stockStatus?: string;
  publicationStatus?: string;
};

export type ProductPublicationStatus = "active" | "draft";

export type ProductStockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "no_inventory";

export type AdminProductListRow = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  thumbnail: string | null;
  compatibleVehicles: string[];
  compatibleVehicleCount: number;
  stock: number;
  available: number;
  reserved: number;
  incoming: number;
  lowStockThreshold: number;
  stockStatus: ProductStockStatus;
  sellingPrice: number | null;
  currency: string;
  publicationStatus: ProductPublicationStatus;
  hasCompatibility: boolean;
  inventoryValue: number;
  reorderAlert: boolean;
  product: Product;
};

export function derivePublicationStatus(input: {
  price: number | null;
  images: string[];
}): ProductPublicationStatus {
  if (input.price != null && input.images.length > 0) return "active";
  return "draft";
}

export function deriveStockStatus(input: {
  hasInventory: boolean;
  available: number;
  threshold: number;
}): ProductStockStatus {
  if (!input.hasInventory) return "no_inventory";
  if (input.available <= 0) return "out_of_stock";
  if (input.available <= input.threshold) return "low_stock";
  return "in_stock";
}
