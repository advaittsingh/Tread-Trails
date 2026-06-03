export type ProductDto = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price?: number;
  currency: string;
  images: string[];
  description: string;
  specs: Array<{ label: string; value: string }>;
  variants: Array<{ id: string; label: string; priceModifier?: number }>;
  compatibleCars: string[];
};

export type ProductsSummary = {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  outOfStock: number;
  lowStock: number;
  missingCompatibility: number;
  inventoryValue: number;
  compatibilityCoveragePercent: number;
};

export type ProductStockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "no_inventory";

export type ProductPublicationStatus = "active" | "draft";

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
  product: ProductDto;
};

export type ProductsListResponse = {
  products: AdminProductListRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ProductsFilterParams = {
  search?: string;
  sku?: string;
  brand?: string;
  category?: string;
  vehicle?: string;
  stockStatus?: string;
  publicationStatus?: string;
  page?: number;
  limit?: number;
};

export type ProductSeo = {
  path: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  robots: string;
};

export type ProductDetailBundle = {
  id: string;
  list: AdminProductListRow;
  product: ProductDto;
  seo: ProductSeo | null;
  vehicleSlugs: string[];
};

export type WizardDraft = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number | null;
  currency: string;
  images: string[];
  description: string;
  specs: Array<{ label: string; value: string }>;
  variants: Array<{ id: string; label: string; priceModifier?: number }>;
  vehicleSlugs: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogImageUrl: string;
    robots: string;
  };
  stockQuantity: number;
};
