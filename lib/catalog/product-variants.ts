import type { ProductVariant } from "@/data/types";

/**
 * Canonical persisted shape for `Product.variants` (Prisma `Json`, default `[]`).
 * Serialize as a JSON array of:
 * `{ "id": string, "label": string, "priceModifier"?: number }`.
 * `priceModifier` is added to `Product.price` (same currency units). Unknown rows are skipped at read time.
 */
export function parseProductVariantsJson(
  value: unknown
): ProductVariant[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;

  const out: ProductVariant[] = [];

  for (const x of value) {
    if (typeof x !== "object" || x === null || !("id" in x) || !("label" in x))
      continue;

    const o = x as { id: unknown; label: unknown; priceModifier?: unknown };

    out.push({
      id: String(o.id),
      label: String(o.label),
      ...(typeof o.priceModifier === "number" ? { priceModifier: o.priceModifier } : {}),
    });
  }

  return out.length ? out : undefined;
}
