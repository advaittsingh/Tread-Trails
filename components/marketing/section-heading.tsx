import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Semantic level for the title — use `h1` when this is the sole page heading. */
  titleAs?: "h1" | "h2" | "h3";
  /** Large uppercase display type for expedition-brand sections. */
  tone?: "default" | "cinematic";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleAs = "h2",
  tone = "default",
}: SectionHeadingProps) {
  const TitleTag = titleAs;
  const cinematic = tone === "cinematic";

  return (
    <div
      className={cn(
        "max-w-3xl space-y-3",
        cinematic && "max-w-4xl space-y-4",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "font-sans font-medium text-primary uppercase",
            cinematic
              ? "text-[10px] tracking-[0.48em]"
              : "text-[11px] tracking-[0.38em]"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <TitleTag
        className={cn(
          cinematic
            ? "heading-cinematic font-heading-display text-3xl leading-[1.05] sm:text-4xl md:text-5xl lg:text-[3.25rem]"
            : "font-heading text-balance text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl"
        )}
      >
        {title}
      </TitleTag>
      {description ? (
        <p
          className={cn(
            "leading-relaxed text-muted-foreground",
            cinematic ? "text-base md:text-lg" : "text-base md:text-lg"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
