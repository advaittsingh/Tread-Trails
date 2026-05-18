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
    "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8",
    innerClassName
  );

  if (!background) {
    return (
      <section
        className={cn(
          "min-h-[calc(100dvh-3.5rem)] border-b border-border/50 bg-background",
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
      className={cn("min-h-[calc(100dvh-3.5rem)] border-y border-border/60", className)}
      innerClassName={inner}
    >
      {children}
    </TextureBackgroundSection>
  );
}
