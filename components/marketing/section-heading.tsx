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
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleAs = "h2",
}: SectionHeadingProps) {
  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        "max-w-3xl space-y-3",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="font-sans text-[11px] font-medium tracking-[0.38em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <TitleTag className="font-heading text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl md:text-5xl">
        {title}
      </TitleTag>
      {description ? (
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
