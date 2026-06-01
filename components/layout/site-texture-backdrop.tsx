import { SITE_BACKGROUNDS } from "@/lib/site-backgrounds";

/** Fixed tire-tread texture behind all public marketing pages. */
export function SiteTextureBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.22] mix-blend-multiply contrast-[0.92] saturate-[0.85]"
        style={{ backgroundImage: `url(${SITE_BACKGROUNDS.tread})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-background/94 via-background/90 to-background/93"
      />
    </>
  );
}
