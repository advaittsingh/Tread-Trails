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
        "max-w-3xl space-y-4",
        cinematic && "max-w-4xl space-y-5",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "font-sans font-medium text-primary uppercase",
            cinematic ? "type-eyebrow" : "text-[11px] font-medium tracking-[0.32em] text-primary uppercase"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <TitleTag
        className={cn(
          cinematic
            ? "heading-cinematic font-heading-display text-[clamp(1.65rem,4.2vw,2.65rem)] sm:text-[clamp(1.85rem,3.8vw,3rem)] md:text-[clamp(2.1rem,3.2vw,3.25rem)] lg:text-[clamp(2.35rem,2.8vw,3.35rem)]"
            : "font-heading text-balance text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl md:text-5xl"
        )}
      >
        {title}
      </TitleTag>
      {description ? (
        <p
          className={cn(
            "type-body-prose max-w-2xl leading-relaxed",
            cinematic && "md:text-[1.0625rem] md:leading-relaxed",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
