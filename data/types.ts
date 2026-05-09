export type Car = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  thumbnail: string;
  category: string;
};

export type ProductVariant = {
  id: string;
  label: string;
  /** Added to base product.price when present */
  priceModifier?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  /** UX grouping for filters & related items */
  category: string;
  price?: number;
  currency?: string;
  images: string[];
  description: string;
  specs: { label: string; value: string }[];
  compatibleCars: string[];
  variants?: ProductVariant[];
};

export type Build = {
  id: string;
  slug: string;
  title: string;
  vehicleSlug: string;
  summary: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  gallery: string[];
  productIds: string[];
};
