import type { ReactNode } from "react";

import { TextureBackgroundSection } from "@/components/marketing/tread-texture-section";
import type { SiteBackgroundKey } from "@/lib/site-backgrounds";
import { siteBackgroundUrl } from "@/lib/site-backgrounds";
import { cn } from "@/lib/utils";

type MarketingPageShellProps = {
  children: ReactNode;
  background?: SiteBackgroundKey;
  className?: string;
  innerClassName?: string;
};

export function MarketingPageShell({
  children,
  background = "mud",
  className,
  innerClassName,
}: MarketingPageShellProps) {
  return (
    <TextureBackgroundSection
      backgroundImage={siteBackgroundUrl(background)}
      className={cn("min-h-[calc(100dvh-4rem)] border-y border-border/60", className)}
      innerClassName={cn(
        "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8",
        innerClassName
      )}
    >
      {children}
    </TextureBackgroundSection>
  );
}
