import type { Product, ProductVariant } from "@/data/types";

export function resolveVariants(product: Product): ProductVariant[] {
  return product.variants?.length
    ? product.variants
    : [{ id: "default", label: "Standard configuration" }];
}

export function unitPriceForVariant(
  product: Product,
  variantId: string
): number | null {
  if (product.price == null) return null;
  const variants = resolveVariants(product);
  const v =
    variants.find((x) => x.id === variantId) ?? variants[0];
  const mod = v.priceModifier ?? 0;
  return product.price + mod;
}
