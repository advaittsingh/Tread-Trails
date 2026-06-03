import type { ProductVariant } from "@tread-trails/shared-types";

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
