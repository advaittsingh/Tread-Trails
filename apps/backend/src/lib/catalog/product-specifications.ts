import type { ProductSpecification } from "@tread-trails/shared-types";

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
