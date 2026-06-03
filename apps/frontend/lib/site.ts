export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function absoluteUrl(path: string): string {
  const base = siteUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
