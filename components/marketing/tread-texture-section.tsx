import type { ReactNode } from "react";

import { SITE_BACKGROUNDS } from "@/lib/site-backgrounds";
import { cn } from "@/lib/utils";

export const TREAD_TEXTURE_BG = SITE_BACKGROUNDS.tread;

type TextureBackgroundSectionProps = {
  children: ReactNode;
  backgroundImage?: string;
  className?: string;
  innerClassName?: string;
};

export function TextureBackgroundSection({
  children,
  backgroundImage = TREAD_TEXTURE_BG,
  className,
  innerClassName,
}: TextureBackgroundSectionProps) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background/92"
      />
      <div className={cn("relative", innerClassName)}>{children}</div>
    </section>
  );
}

type TreadTextureSectionProps = Omit<TextureBackgroundSectionProps, "backgroundImage">;

export function TreadTextureSection(props: TreadTextureSectionProps) {
  return <TextureBackgroundSection backgroundImage={TREAD_TEXTURE_BG} {...props} />;
}
