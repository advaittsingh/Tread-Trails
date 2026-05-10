/**
 * Rewrites `data/product-vehicle-compatibility-edges.ts` from each catalog product’s
 * resolved `compatibleCars` (derived from the current edges file + `rawProducts`).
 *
 *   npx tsx scripts/generate-product-vehicle-edges.ts
 *
 * Prefer editing `product-vehicle-compatibility-edges.ts` directly, then leave products as-is.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { products } from "../data/products";

const outFile = join(process.cwd(), "data/product-vehicle-compatibility-edges.ts");

const edges = products.flatMap((p) =>
  (p.compatibleCars ?? []).map((vehicleSlug) => ({
    productSlug: p.slug,
    vehicleSlug,
  }))
);

const body = edges
  .map(
    (e) =>
      `  { productSlug: ${JSON.stringify(e.productSlug)}, vehicleSlug: ${JSON.stringify(e.vehicleSlug)} },`
  )
  .join("\n");

const content = `/**
 * Explicit product ↔ vehicle pairs — authoritative static mapping (mirrors ProductVehicleCompatibility).
 * Edit this file directly to change compat; keep seeds and APIs in sync.
 */
export const PRODUCT_VEHICLE_COMPATIBILITY_EDGES = [
${body}
] as const satisfies ReadonlyArray<{
  readonly productSlug: string;
  readonly vehicleSlug: string;
}>;

`;

writeFileSync(outFile, content, "utf8");
console.info(`Wrote ${edges.length} edges → ${outFile}`);
