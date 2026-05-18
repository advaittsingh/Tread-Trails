export const SITE_BACKGROUNDS = {
  tread: "/bg-tread.png",
  mud: "/bg-mud.png",
  terrain: "/bg3.png",
  bg3: "/bg3.png",
  bg4: "/bg4.png",
  bg5: "/bg5.png",
} as const;

export type SiteBackgroundKey = keyof typeof SITE_BACKGROUNDS;

export function siteBackgroundUrl(key: SiteBackgroundKey): string {
  return SITE_BACKGROUNDS[key];
}
