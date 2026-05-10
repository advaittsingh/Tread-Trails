"use client";

import type { Product } from "@/data/types";
import { resolveVariants } from "@/lib/pricing";
import { toastSuccess } from "@/lib/toast";
import { useCart } from "@/contexts/cart-context";

import { Button } from "@/components/ui/button";

export function BundleAddButton({
  items,
  label = "Add bundle to cart",
}: {
  items: Product[];
  label?: string;
}) {
  const { addItem } = useCart();

  function addBundle() {
    for (const product of items) {
      const v = resolveVariants(product)[0];
      addItem({ product, variantId: v.id });
    }
    toastSuccess(
      "Bundle added to cart",
      `${items.length} item${items.length === 1 ? "" : "s"} queued`
    );
  }

  return (
    <Button type="button" variant="secondary" onClick={addBundle} aria-label={label}>
      {label}
    </Button>
  );
}
