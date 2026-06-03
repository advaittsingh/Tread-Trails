import { cn } from "@/lib/utils";

/** Glass panels over textured section backgrounds (homepage, etc.). */
export function cardShellClass(onTextureBg?: boolean, className?: string) {
  return cn(
    onTextureBg
      ? "glass-panel border-primary/15 shadow-card transition-[transform,box-shadow] duration-500 hover:shadow-card-hover"
      : "border-border/70 bg-card shadow-card transition-[transform,box-shadow] duration-500 hover:shadow-card-hover",
    className
  );
}

export function cardWellClass(onTextureBg?: boolean, className?: string) {
  return cn(onTextureBg ? "bg-muted/50" : "bg-muted/40", className);
}

export function cardContentClass(onTextureBg?: boolean, className?: string) {
  return cn(onTextureBg ? "glass-panel border-t border-primary/10" : "bg-card", className);
}

export function cardInsetStripClass(onTextureBg?: boolean, className?: string) {
  return cn(
    onTextureBg
      ? "border-primary/15 bg-white/50 backdrop-blur-[4px]"
      : "border-border/60 bg-background",
    className
  );
}
