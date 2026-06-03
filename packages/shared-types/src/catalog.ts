/** Storefront catalog shapes (from legacy `data/types.ts`). */

export type Car = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  thumbnail: string;
  category: string;
  engineSummary: string;
  modelYearsLabel: string;
  trimSummary: string;
  makeSlug?: string;
  makeName?: string;
  modelSlug?: string;
  modelName?: string;
  generationKey?: string;
};

export type ProductVariant = {
  id: string;
  label: string;
  priceModifier?: number;
};

export type ProductSpecification = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price?: number;
  currency?: string;
  images: string[];
  description: string;
  specs: ProductSpecification[];
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
  homeSpotlightRank?: number | null;
};
