import type { ProductVariant } from "@/data/types";

/** Mongoose lean product shape used for checkout pricing */
export type ProductPricingSource = {
  price?: number | null;
  variants?: ProductVariant[];
};

export function resolveVariants(
  product: ProductPricingSource
): ProductVariant[] {
  return product.variants?.length
    ? product.variants
    : [{ id: "default", label: "Standard configuration" }];
}

export function unitPriceForVariant(
  product: ProductPricingSource,
  variantId: string
): number | null {
  if (product.price == null) return null;
  const variants = resolveVariants(product);
  const v = variants.find((x) => x.id === variantId) ?? variants[0];
  const mod = v.priceModifier ?? 0;
  return product.price + mod;
}
