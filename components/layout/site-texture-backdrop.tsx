import { SITE_BACKGROUNDS } from "@/lib/site-backgrounds";

/** Fixed tire-tread texture behind all public marketing pages. */
export function SiteTextureBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${SITE_BACKGROUNDS.tread})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-background/88 via-background/82 to-background/90"
      />
    </>
  );
}
