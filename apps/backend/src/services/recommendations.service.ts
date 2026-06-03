import type { Product } from "@tread-trails/shared-types";

import {
  getProductBySlug,
  listProducts,
} from "./catalog/products.service.js";

export type RecommendationEntry = {
  productSlug: string;
  rationale: string;
  badge?: string;
};

export type UpgradeStep = RecommendationEntry & { step: number };

export type ProductRecommendationsPayload = {
  forVehicle: RecommendationEntry[];
  alsoBought: RecommendationEntry[];
  upgradePath: { intro: string; steps: UpgradeStep[] };
};

const VEHICLE_COPY = [
  "Strong platform fit — installers often pair this with your chassis program.",
  "Popular on builds that share suspension and load assumptions with this SKU.",
  "Keeps geometry, guards, and tyre packages coherent for touring rigs.",
];

const ALSO_COPY = [
  "Frequently added in the same studio session — complementary stack.",
  "High attachment rate with carts that include this product.",
  "Adds capability without fighting your baseline tune.",
];

const PATH_INTRO =
  "A staged upgrade path — prioritize fundamentals, then rotating mass and recovery.";

const CATEGORY_PRIORITY = [
  "Suspension",
  "Wheels",
  "Winches",
  "Lighting",
  "Armor",
  "Recovery",
  "Accessories",
];

function getVehicleSlugsForProduct(catalog: Product[], productSlug: string): string[] {
  const p = catalog.find((x) => x.slug === productSlug);
  return p?.compatibleCars ?? [];
}

function getProductSlugsForVehicle(catalog: Product[], vehicleSlug: string): string[] {
  return catalog
    .filter((p) => p.compatibleCars.includes(vehicleSlug))
    .map((p) => p.slug)
    .sort();
}

function productSlugsSharePlatform(
  catalog: Product[],
  a: string,
  b: string
): boolean {
  const setA = new Set(getVehicleSlugsForProduct(catalog, a));
  return getVehicleSlugsForProduct(catalog, b).some((v) => setA.has(v));
}

function pickRationale(pool: string[], i: number): string {
  return pool[i % pool.length];
}

function shuffleStable(slugs: string[], seed: string): string[] {
  const arr = [...slugs];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRelatedProducts(catalog: Product[], slug: string, limit = 4): Product[] {
  const p = catalog.find((x) => x.slug === slug);
  if (!p) return [];
  return catalog
    .filter(
      (x) =>
        x.slug !== slug &&
        (x.category === p.category || x.brand === p.brand)
    )
    .slice(0, limit);
}

function getBundleSuggestion(
  catalog: Product[],
  slug: string,
  limit = 2
): Product[] {
  const p = catalog.find((x) => x.slug === slug);
  if (!p) return [];
  return catalog
    .filter(
      (x) => x.slug !== slug && productSlugsSharePlatform(catalog, x.slug, p.slug)
    )
    .slice(0, limit);
}

export async function buildRecommendationsPayload(
  productSlug: string
): Promise<ProductRecommendationsPayload> {
  const empty = {
    forVehicle: [],
    alsoBought: [],
    upgradePath: { intro: "", steps: [] },
  };

  const current = await getProductBySlug(productSlug);
  if (!current) return empty;

  const catalog = await listProducts();

  const platforms = getVehicleSlugsForProduct(catalog, productSlug);
  const vehicleCandidates = new Set<string>();
  for (const v of platforms) {
    for (const s of getProductSlugsForVehicle(catalog, v)) {
      if (s !== productSlug) vehicleCandidates.add(s);
    }
  }

  let forVehicleSlugs = shuffleStable(
    Array.from(vehicleCandidates),
    `${productSlug}:vehicle`
  ).slice(0, 4);

  const related = getRelatedProducts(catalog, productSlug, 12);
  if (forVehicleSlugs.length === 0) {
    forVehicleSlugs = related.slice(0, 4).map((p) => p.slug);
  }

  const forVehicle: RecommendationEntry[] = forVehicleSlugs.map((slug, i) => ({
    productSlug: slug,
    rationale: pickRationale(VEHICLE_COPY, i),
    badge: i === 0 ? "Platform match" : undefined,
  }));

  const bundle = getBundleSuggestion(catalog, productSlug);
  const alsoPool = Array.from(
    new Set([...bundle.map((p) => p.slug), ...related.map((p) => p.slug)])
  ).filter((s) => s !== productSlug);

  const alsoBoughtSlugs = shuffleStable(alsoPool, `${productSlug}:also`).slice(0, 4);

  const alsoBought: RecommendationEntry[] = alsoBoughtSlugs.map((slug, i) => ({
    productSlug: slug,
    rationale: pickRationale(ALSO_COPY, i),
    badge: i === 0 ? "Studio pairing" : undefined,
  }));

  const poolProducts = alsoPool
    .map((s) => catalog.find((p) => p.slug === s))
    .filter(Boolean) as Product[];

  const steps: UpgradeStep[] = [];
  for (const cat of CATEGORY_PRIORITY) {
    const hit = poolProducts.find((p) => p.category === cat);
    if (hit && !steps.some((s) => s.productSlug === hit.slug)) {
      steps.push({
        step: steps.length + 1,
        productSlug: hit.slug,
        rationale: `Prioritize ${cat.toLowerCase()} before stacking accessories that assume this baseline.`,
        badge: `Step ${steps.length + 1}`,
      });
    }
    if (steps.length >= 4) break;
  }

  for (const p of poolProducts) {
    if (steps.length >= 3) break;
    if (steps.some((s) => s.productSlug === p.slug)) continue;
    steps.push({
      step: steps.length + 1,
      productSlug: p.slug,
      rationale:
        "Completes the arc our field teams suggest after the primary upgrade lands.",
      badge: `Step ${steps.length + 1}`,
    });
  }

  const normalizedSteps = steps.map((s, i) => ({
    ...s,
    step: i + 1,
    badge: `Step ${i + 1}`,
  }));

  return {
    forVehicle,
    alsoBought,
    upgradePath: { intro: PATH_INTRO, steps: normalizedSteps },
  };
}
