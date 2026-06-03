import type { ReactNode } from "react";

import { SITE_BACKGROUNDS } from "@/lib/site-backgrounds";
import { cn } from "@/lib/utils";

export const TREAD_TEXTURE_BG = SITE_BACKGROUNDS.tread;

type TextureOverlay = "light" | "dark" | "none";

type TextureBackgroundSectionProps = {
  children: ReactNode;
  backgroundImage?: string;
  overlay?: TextureOverlay;
  className?: string;
  innerClassName?: string;
};

const OVERLAY_CLASS: Record<TextureOverlay, string> = {
  light:
    "bg-gradient-to-b from-background/88 via-background/82 to-background/90",
  dark: "bg-gradient-to-b from-foreground/92 via-foreground/88 to-foreground/94",
  none: "",
};

export function TextureBackgroundSection({
  children,
  backgroundImage = TREAD_TEXTURE_BG,
  overlay = "light",
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
      {overlay !== "none" ? (
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0", OVERLAY_CLASS[overlay])}
        />
      ) : null}
      <div className={cn("relative", innerClassName)}>{children}</div>
    </section>
  );
}

type TreadTextureSectionProps = Omit<TextureBackgroundSectionProps, "backgroundImage">;

export function TreadTextureSection(props: TreadTextureSectionProps) {
  return <TextureBackgroundSection backgroundImage={TREAD_TEXTURE_BG} {...props} />;
}

/** Plain warm-white band — alternates with textured sections on the homepage. */
export function PlainSection({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <section
      className={cn("border-y border-border/50 bg-background py-20 lg:py-24", className)}
    >
      <div
        className={cn(
          "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
