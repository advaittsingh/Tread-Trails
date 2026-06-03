import { env } from "../config/env.js";

export function absoluteUrl(path: string): string {
  const base = env.siteUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
