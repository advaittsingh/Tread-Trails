"use client";

import { Minus, Plus } from "lucide-react";

import type { Product } from "@/data/types";
import { resolveVariants } from "@/lib/pricing";
import { useCart } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

function cartLineId(productSlug: string, variantId: string) {
  return `${productSlug}__${variantId}`;
}

type AddToCartButtonProps = {
  product: Product;
  variantId?: string;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  product,
  variantId,
  className,
  label = "Add to cart",
}: AddToCartButtonProps) {
  const { addItem, setQty, lines } = useCart();
  const variants = resolveVariants(product);
  const vid = variantId ?? variants[0].id;
  const lineId = cartLineId(product.slug, vid);
  const line = lines.find((l) => l.lineId === lineId);
  const qty = line?.quantity ?? 0;

  if (qty < 1) {
    return (
      <Button
        type="button"
        className={className}
        aria-label={`${label}: ${product.name}`}
        onClick={() => addItem({ product, variantId: vid })}
      >
        {label}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-8 items-stretch overflow-hidden rounded-md border border-input bg-background text-sm font-medium shadow-none",
        className
      )}
      role="group"
      aria-label={`Quantity for ${product.name}`}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-10 shrink-0 rounded-none border-0 px-0 hover:bg-muted"
        aria-label="Decrease quantity"
        onClick={() => setQty(lineId, qty - 1)}
      >
        <Minus className="size-4" />
      </Button>
      <span
        className="flex min-w-[2.25rem] flex-1 items-center justify-center border-x border-input bg-muted/15 tabular-nums"
        aria-live="polite"
      >
        {qty}
      </span>
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-10 shrink-0 rounded-none border-0 px-0 hover:bg-muted"
        aria-label="Increase quantity"
        onClick={() => setQty(lineId, qty + 1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
