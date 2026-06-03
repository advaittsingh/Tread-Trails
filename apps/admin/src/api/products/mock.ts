import type {
  AdminProductListRow,
  ProductDetailBundle,
  ProductsListResponse,
  ProductsSummary,
} from "./types";

export const mockProductsSummary: ProductsSummary = {
  totalProducts: 240,
  activeProducts: 198,
  draftProducts: 42,
  outOfStock: 8,
  lowStock: 14,
  missingCompatibility: 42,
  inventoryValue: 18_450_000,
  compatibilityCoveragePercent: 82.5,
};

const sample: AdminProductListRow = {
  id: "prod_mock_1",
  slug: "bf-goodrich-ko2",
  name: "BFG KO2 All-Terrain",
  sku: "TT-BF-GOODRICH-KO2",
  brand: "BFGoodrich",
  category: "Tyres",
  thumbnail: "/vehicles/placeholder.jpg",
  compatibleVehicles: ["Toyota Fortuner", "Mahindra Thar"],
  compatibleVehicleCount: 2,
  stock: 24,
  available: 22,
  reserved: 2,
  incoming: 8,
  lowStockThreshold: 5,
  stockStatus: "in_stock",
  sellingPrice: 18500,
  currency: "INR",
  publicationStatus: "active",
  hasCompatibility: true,
  inventoryValue: 444000,
  reorderAlert: false,
  product: {
    id: "prod_mock_1",
    slug: "bf-goodrich-ko2",
    name: "BFG KO2 All-Terrain",
    brand: "BFGoodrich",
    category: "Tyres",
    price: 18500,
    currency: "INR",
    images: ["/vehicles/placeholder.jpg"],
    description: "Premium all-terrain tyre for Indian 4×4 platforms.",
    specs: [{ label: "Size", value: "265/65 R17" }],
    variants: [{ id: "265-65-r17", label: "265/65 R17" }],
    compatibleCars: ["toyota-fortuner", "mahindra-thar"],
  },
};

export const mockProductsList: ProductsListResponse = {
  products: [sample, { ...sample, id: "prod_mock_2", name: "ARB OME Lift Kit", sku: "TT-ARB-OME", stockStatus: "low_stock", reorderAlert: true }],
  total: 2,
  page: 1,
  limit: 25,
  totalPages: 1,
};

export const mockProductBundle: ProductDetailBundle = {
  id: sample.id,
  list: sample,
  product: sample.product,
  seo: {
    path: `/products/${sample.slug}`,
    metaTitle: sample.name,
    metaDescription: sample.product.description.slice(0, 120),
    canonicalUrl: "",
    ogImageUrl: sample.thumbnail ?? "",
    robots: "index,follow",
  },
  vehicleSlugs: ["toyota-fortuner", "mahindra-thar"],
};
