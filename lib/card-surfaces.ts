import { cn } from "@/lib/utils";

/** Warm cream surfaces that sit on textured section backgrounds (homepage, etc.). */
export function cardShellClass(onTextureBg?: boolean, className?: string) {
  return cn(
    onTextureBg
      ? "border-primary/20 bg-background/90 shadow-card backdrop-blur-sm"
      : "border-border/70 bg-card shadow-card",
    className
  );
}

export function cardWellClass(onTextureBg?: boolean, className?: string) {
  return cn(onTextureBg ? "bg-muted/80" : "bg-muted/40", className);
}

export function cardContentClass(onTextureBg?: boolean, className?: string) {
  return cn(onTextureBg ? "bg-background/85" : "bg-card", className);
}

export function cardInsetStripClass(onTextureBg?: boolean, className?: string) {
  return cn(
    onTextureBg
      ? "border-primary/15 bg-secondary/70"
      : "border-border/60 bg-background",
    className
  );
}
