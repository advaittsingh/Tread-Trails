import type { ProductSpecification, ProductVariant } from "@/data/types";

export type VariantFormRow = {
  id: string;
  label: string;
  priceModifierStr: string;
};

export function specsPayload(
  rows: ProductSpecification[]
): ProductSpecification[] {
  return rows
    .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
    .filter((s) => s.label !== "" && s.value !== "");
}

export function variantsPayload(
  rows: VariantFormRow[]
):
  | { ok: true; variants: ProductVariant[] }
  | { ok: false; message: string } {
  const out: ProductVariant[] = [];
  for (const r of rows) {
    const id = r.id.trim();
    const label = r.label.trim();
    const pmTrim = r.priceModifierStr.trim();
    if (id === "" && label === "" && pmTrim === "") continue;
    if (id === "" || label === "") {
      return {
        ok: false,
        message:
          "Each variant row needs both ID and label, or remove incomplete rows.",
      };
    }
    let priceModifier: number | undefined;
    if (pmTrim !== "") {
      const n = Number.parseInt(pmTrim, 10);
      if (Number.isNaN(n)) {
        return {
          ok: false,
          message:
            "Variant price modifier must be a whole number (same units as price), or leave blank.",
        };
      }
      priceModifier = n;
    }
    const row: ProductVariant = { id, label };
    if (priceModifier !== undefined) row.priceModifier = priceModifier;
    out.push(row);
  }
  return { ok: true, variants: out };
}
