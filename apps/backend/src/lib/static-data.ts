import type { Build, Car, Product } from "@tread-trails/shared-types";

import type { BrandEntry } from "./catalog/map-brand.js";

export async function loadStaticProducts(): Promise<Product[]> {
  try {
    const m = await import("./static-data.runtime.js");
    return m.loadStaticProductsRuntime();
  } catch {
    return [];
  }
}

export async function loadStaticCars(): Promise<Car[]> {
  try {
    const m = await import("./static-data.runtime.js");
    return m.loadStaticCarsRuntime();
  } catch {
    return [];
  }
}

export async function loadStaticBuilds(): Promise<Build[]> {
  try {
    const m = await import("./static-data.runtime.js");
    return m.loadStaticBuildsRuntime();
  } catch {
    return [];
  }
}

export async function loadStaticBrandEntries(): Promise<BrandEntry[]> {
  try {
    const m = await import("./static-data.runtime.js");
    return m.loadStaticBrandEntriesRuntime();
  } catch {
    return [];
  }
}
