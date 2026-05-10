/**
 * Public marketing contact & social defaults.
 * Override in production with NEXT_PUBLIC_* env vars (see each helper).
 */

export function siteContactEmail(): string {
  const v = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return v && v.length > 0 ? v : "hello@treadtrails.com";
}

/** Single-line studio presence for footer / copy */
export function siteStudioLocationsLine(): string {
  const v = process.env.NEXT_PUBLIC_STUDIO_LOCATIONS?.trim();
  return v && v.length > 0 ? v : "Bengaluru · Mumbai · Dubai";
}

type SocialEnv =
  | "NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL"
  | "NEXT_PUBLIC_SOCIAL_YOUTUBE_URL"
  | "NEXT_PUBLIC_SOCIAL_LINKEDIN_URL";

/** Empty string env = hide that network; unset = use fallback public URL. */
function resolvedSocialUrl(envKey: SocialEnv, fallback: string): string | null {
  const raw = process.env[envKey];
  if (raw === "") return null;
  const t = raw?.trim();
  return t && t.length > 0 ? t : fallback;
}

export type SiteSocialProfile = {
  label: "Instagram" | "YouTube" | "LinkedIn";
  href: string;
};

export function siteSocialProfiles(): SiteSocialProfile[] {
  const ig = resolvedSocialUrl(
    "NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL",
    "https://www.instagram.com/treadtrails"
  );
  const yt = resolvedSocialUrl(
    "NEXT_PUBLIC_SOCIAL_YOUTUBE_URL",
    "https://www.youtube.com/@treadtrails"
  );
  const li = resolvedSocialUrl(
    "NEXT_PUBLIC_SOCIAL_LINKEDIN_URL",
    "https://www.linkedin.com/company/tread-trails"
  );
  const out: SiteSocialProfile[] = [];
  if (ig) out.push({ label: "Instagram", href: ig });
  if (yt) out.push({ label: "YouTube", href: yt });
  if (li) out.push({ label: "LinkedIn", href: li });
  return out;
}

/** Schema.org `sameAs` — omit entries the studio explicitly hides. */
export function siteSocialSameAs(): string[] {
  return siteSocialProfiles().map((p) => p.href);
}
