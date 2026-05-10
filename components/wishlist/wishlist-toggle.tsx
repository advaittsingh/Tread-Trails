"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/wishlist-context";

import { Button } from "@/components/ui/button";

export function WishlistToggle({
  productSlug,
  label,
  className,
}: {
  productSlug: string;
  /** Accessible name, e.g. product title */
  label: string;
  className?: string;
}) {
  const { has, toggle, isRemoteHydrating, isMutationPending } = useWishlist();
  const on = has(productSlug);
  const disabled = isRemoteHydrating || isMutationPending;

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      disabled={disabled}
      className={cn(
        "border border-border/70 bg-background/90 shadow-card backdrop-blur-sm transition hover:scale-105 disabled:pointer-events-none disabled:opacity-60",
        on && "border-primary/40 text-primary",
        className
      )}
      aria-label={on ? `Remove ${label} from wishlist` : `Save ${label} to wishlist`}
      aria-busy={isMutationPending}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) toggle(productSlug);
      }}
    >
      <Heart className={cn("size-4", on && "fill-current")} aria-hidden />
    </Button>
  );
}
