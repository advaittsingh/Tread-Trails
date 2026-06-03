import type { ProductSpecification } from "@/data/types";

/**
 * Canonical persisted shape for `Product.specs` (Prisma `Json`, default `[]`).
 * Serialize as a JSON array of `{ "label": string, "value": string }`.
 * Invalid or unknown JSON coerces to an empty array at read time (see Prisma mapper).
 */
export function parseProductSpecificationsJson(
  value: unknown
): ProductSpecification[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (x) =>
        typeof x === "object" &&
        x !== null &&
        "label" in x &&
        "value" in x
    )
    .map((x) => {
      const o = x as { label: unknown; value: unknown };
      return {
        label: String(o.label ?? ""),
        value: String(o.value ?? ""),
      };
    });
}
