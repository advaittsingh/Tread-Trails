"use client";

import type { MouseEvent } from "react";
import { GitCompareArrows } from "lucide-react";

import { MAX_COMPARE, useCompare } from "@/contexts/compare-context";
import { toastWarning } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export function CompareToggle({
  productSlug,
  label,
  compact = true,
  className,
}: {
  productSlug: string;
  label: string;
  compact?: boolean;
  className?: string;
}) {
  const { has, toggle, isFull } = useCompare();
  const on = has(productSlug);
  const blocked = !on && isFull;

  const title = blocked
    ? `You can compare up to ${MAX_COMPARE} products. Remove one to add another.`
    : on
      ? `Remove ${label} from compare`
      : `Add ${label} to compare`;

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (blocked) {
      toastWarning(
        "Compare list is full",
        `Remove an item to add another (max ${MAX_COMPARE}).`
      );
      return;
    }
    toggle(productSlug);
  };

  if (!compact) {
    return (
      <Button
        type="button"
        variant={on ? "secondary" : "outline"}
        size="default"
        title={title}
        aria-label={title}
        aria-pressed={on}
        className={cn(
          "gap-2 shadow-none",
          on && "border-primary/40 text-primary",
          blocked && "opacity-80 ring-1 ring-amber-500/30",
          className
        )}
        onClick={onClick}
      >
        <GitCompareArrows className="size-4 shrink-0" aria-hidden />
        {on ? "In compare" : "Compare"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      title={title}
      aria-label={title}
      aria-pressed={on}
      className={cn(
        "border border-border/70 bg-background/90 shadow-card backdrop-blur-sm transition hover:scale-105",
        on && "border-primary/40 text-primary",
        blocked && "opacity-80 ring-1 ring-amber-500/25",
        className
      )}
      onClick={onClick}
    >
      <GitCompareArrows className={cn("size-4", on && "text-primary")} aria-hidden />
    </Button>
  );
}
