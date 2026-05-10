import { products } from "@/data/index";
import type { Product } from "@/data/types";

export function searchCatalogProducts(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored = products
    .map((p) => {
      const name = p.name.toLowerCase();
      const brand = p.brand.toLowerCase();
      const cat = p.category.toLowerCase();
      const slug = p.slug.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score += 8;
      else if (name.includes(q)) score += 5;
      if (brand.startsWith(q)) score += 4;
      else if (brand.includes(q)) score += 2;
      if (cat.includes(q)) score += 2;
      if (slug.includes(q)) score += 1;
      return score > 0 ? { p, score } : null;
    })
    .filter(Boolean) as { p: Product; score: number }[];

  scored.sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));

  const seen = new Set<string>();
  const out: Product[] = [];
  for (const { p } of scored) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
