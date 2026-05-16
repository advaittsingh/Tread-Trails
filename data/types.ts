export type Car = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  thumbnail: string;
  category: string;
  /** Representative engines we kit for (market variants exist). */
  engineSummary: string;
  /** Human-readable model-year span for catalog alignment. */
  modelYearsLabel: string;
  /** Trims / packages we commonly reference when fitting parts. */
  trimSummary: string;
  /** OEM hierarchy (from DB when available). */
  makeSlug?: string;
  makeName?: string;
  modelSlug?: string;
  modelName?: string;
  generationKey?: string;
};

/** Persisted on `Product.variants` (JSON / Prisma); drives PDP variant selector and checkout line pricing. */
export type ProductVariant = {
  id: string;
  label: string;
  /** Added to base `Product.price` when present (same integer units as price). */
  priceModifier?: number;
};

/** Stored on `Product.specs` (JSON / Prisma) and rendered as structured specs on PDPs. */
export type ProductSpecification = {
  label: string;
  value: string;
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
  specs: ProductSpecification[];
  /**
   * Vehicle slugs from static edges or `ProductVehicleCompatibility` (Neon).
   * UI maps these to labels via `cars` / PDP tags and filters.
   */
  compatibleCars: string[];
  /** From `Product.variants` JSON; when absent / empty, UX falls back to a single default SKU. */
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
  /**
   * Mirrors `PortfolioBuild.productIds` — legacy catalog tokens (`Product.id` / `Product.legacyId`).
   * Canonical graph edges live in `PortfolioBuildProduct` when DB is used; APIs prefer joins then fall back here.
   */
  productIds: string[];
  /** Portfolio editorial order for `/` featured builds; lower first; omit when not spotlighted. */
  homeSpotlightRank?: number | null;
};
