import type { ReactNode } from "react";

import { TextureBackgroundSection } from "@/components/marketing/tread-texture-section";
import type { SiteBackgroundKey } from "@/lib/site-backgrounds";
import { siteBackgroundUrl } from "@/lib/site-backgrounds";
import { cn } from "@/lib/utils";

type MarketingPageShellProps = {
  children: ReactNode;
  /** Omit or pass undefined for plain warm-white (default). */
  background?: SiteBackgroundKey;
  className?: string;
  innerClassName?: string;
};

export function MarketingPageShell({
  children,
  background,
  className,
  innerClassName,
}: MarketingPageShellProps) {
  const inner = cn(
    "mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28",
    innerClassName
  );

  if (!background) {
    return (
      <section
        className={cn(
          "min-h-[calc(100dvh-4rem)] border-b border-border/40",
          className
        )}
      >
        <div className={inner}>{children}</div>
      </section>
    );
  }

  return (
    <TextureBackgroundSection
      backgroundImage={siteBackgroundUrl(background)}
      className={cn("min-h-[calc(100dvh-4rem)] border-y border-border/50", className)}
      innerClassName={inner}
    >
      {children}
    </TextureBackgroundSection>
  );
}
