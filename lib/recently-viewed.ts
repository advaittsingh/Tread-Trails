const STORAGE_KEY = "tread-trails-recent-products-v1";
const MAX = 8;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs.slice(0, MAX)));
}

/** Append current slug to the front of the recency list (deduped). */
export function recordProductView(slug: string) {
  const s = slug.trim();
  if (!s) return;
  const prev = read();
  const next = [s, ...prev.filter((x) => x !== s)].slice(0, MAX);
  write(next);
}

/** Recent slugs excluding `excludeSlug` (typically the active PDP). */
export function getRecentProductSlugs(excludeSlug?: string): string[] {
  const list = read();
  if (!excludeSlug) return list;
  return list.filter((x) => x !== excludeSlug);
}
