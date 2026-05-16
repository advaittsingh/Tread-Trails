/**
 * One-off: reads /tmp/advven-all.json (from https://api.advven.com/api/v1/allProducts)
 * and writes ../data/products.ts — run: node scripts/generate-products-from-advven.mjs
 *
 * After regenerating products, refresh explicit compat edges:
 *   npx tsx scripts/generate-product-vehicle-edges.ts
 * (expects each product to carry `compatibleCars` temporarily, or edit edges by hand.)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = "/tmp/advven-all.json";
const out = path.join(root, "data", "products.ts");

const raw = JSON.parse(fs.readFileSync(src, "utf8"));

function slugify(s, id) {
  const base = String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `${base || "product"}-${String(id).slice(-6)}`;
}

const categoryLabel = {
  wheels: "Wheels",
  suspension: "Suspension",
  winches: "Winches",
  protection_equipment: "Protection",
};

function inferVendor(title, description) {
  const t = `${title} ${description}`.toLowerCase();
  if (/\bmrw\b|method/.test(t)) return "Method Race Wheels";
  if (/\bwarn\b/.test(t)) return "WARN Industries";
  if (/old man emu|nitrocharger|ome\b/.test(t)) return "ARB / Old Man Emu";
  if (/\bafn\b/.test(t)) return "AFN 4x4";
  if (/\bkbp\b/.test(t)) return "KBP";
  if (/rhino/.test(t)) return "Rhino-Rack";
  if (/kaymar|kaymar/.test(t)) return "Kaymar";
  if (/ironman|foam cell/.test(t)) return "Ironman 4x4";
  if (/bushranger|safari snorkel|snorkel/.test(t)) return "Bushranger";
  if (/tjm|bull bar|bullbar/.test(t)) return "TJM";
  return "Advven";
}

function platformToCars(brand) {
  const b = String(brand || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (b.includes("mahindra") || b.includes("thar"))
    return ["mahindra-thar-gen1-crde", "mahindra-thar", "mahindra-thar-roxx"];
  if (b.includes("jimny") || b.includes("suzuki"))
    return ["maruti-suzuki-jimny", "mahindra-thar", "jeep-wrangler-jk", "jeep-wrangler-jl"];
  if (b.includes("fortuner"))
    return ["toyota-fortuner-gen1", "toyota-fortuner-gen2", "toyota-fortuner-gen3"];
  if (b.includes("hilux")) return ["toyota-hilux"];
  if (b === "toyota")
    return ["toyota-hilux", "toyota-fortuner-gen2", "toyota-land-cruiser-200-series"];
  if (b.includes("wrangler") || b.includes("jeep"))
    return ["jeep-wrangler-jk", "jeep-wrangler-jl"];
  if (b.includes("defender") || b.includes("land"))
    return ["toyota-land-cruiser-200-series", "toyota-land-cruiser-300-series"];
  if (b.includes("bronco") || b.includes("endeavour") || b.includes("ford"))
    return ["ford-endeavour-3200cc", "ford-endeavour-2000cc-10speed"];
  return ["toyota-hilux", "jeep-wrangler-jl", "ford-endeavour-3200cc"];
}

function descToSpecs(description) {
  const lines = String(description || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
  return lines.slice(0, 3).map((line, i) => ({
    label: `Detail ${i + 1}`,
    value: line.length > 120 ? `${line.slice(0, 117)}…` : line,
  }));
}

const sorted = [...raw].sort((a, b) => {
  const ca = categoryLabel[a.category] || a.category;
  const cb = categoryLabel[b.category] || b.category;
  if (ca !== cb) return ca.localeCompare(cb);
  return String(a.title).localeCompare(String(b.title));
});

const products = sorted.map((p, idx) => {
  const id = `p${idx + 1}`;
  const slug = slugify(p.slug || p.title, p.id);
  const price = Math.round(Number(p.price) / 100);
  const imgs = [];
  if (p.image) imgs.push(p.image);
  const colorImgs = p.colors?.[0]?.images?.map((x) => x.url) || [];
  for (const u of colorImgs) {
    if (u && !imgs.includes(u)) imgs.push(u);
    if (imgs.length >= 4) break;
  }
  if (imgs.length === 0) imgs.push("https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80");

  const variants =
    Array.isArray(p.colors) && p.colors.length > 1
      ? p.colors.slice(0, 4).map((c, i) => ({
          id: `c${i}`,
          label: String(c.name || `Option ${i + 1}`),
          priceModifier: 0,
        }))
      : undefined;

  const description = String(p.description || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 520);

  return {
    id,
    slug,
    name: String(p.title || "Product").trim(),
    brand: inferVendor(p.title, p.description),
    category: categoryLabel[p.category] || p.category,
    price,
    currency: "INR",
    variants,
    images: imgs.slice(0, 4),
    description: description || "Sourced from Advven catalog (demo).",
    specs: descToSpecs(p.description),
    compatibleCars: platformToCars(p.brand),
    _advvenId: p.id,
  };
});

function firstBy(slug, cat) {
  return products.find(
    (x) => x.compatibleCars.includes(slug) && x.category === cat
  );
}

function pickFor(slug, cats) {
  return cats.map((cat) => {
    const primary = firstBy(slug, cat);
    if (primary) return primary.id;
    const anyCat = products.find((x) => x.category === cat);
    return (anyCat || products[0]).id;
  });
}

const buildPick = {
  b1: pickFor("toyota-hilux", ["Wheels", "Suspension", "Winches", "Protection"]),
  b2: pickFor("mahindra-thar", ["Protection", "Wheels", "Suspension"]),
  b3: pickFor("jeep-wrangler-jk", ["Wheels", "Protection", "Winches", "Suspension"]),
  b4: pickFor("toyota-land-cruiser-300-series", ["Wheels", "Winches", "Protection"]),
  b5: pickFor("ford-endeavour-3200cc", ["Wheels", "Protection", "Winches", "Suspension"]),
  b6: pickFor("toyota-fortuner-gen2", ["Wheels", "Winches", "Protection"]),
};

const lines = [];
lines.push(`import type { Product } from "./types";`);
lines.push(``);
lines.push(`/**`);
lines.push(` * Mock catalog — rows sourced from Advven public API (`);
lines.push(` * https://api.advven.com/api/v1/allProducts`);
lines.push(` * ) and storefront categories on https://www.advven.com/ .`);
lines.push(` * Prices converted from API minor units to whole INR.`);
lines.push(` */`);
lines.push(`export const products: Product[] = [`);

for (const p of products) {
  const { _advvenId, ...rest } = p;
  lines.push(`  {`);
  lines.push(`    id: ${JSON.stringify(rest.id)},`);
  lines.push(`    slug: ${JSON.stringify(rest.slug)},`);
  lines.push(`    name: ${JSON.stringify(rest.name)},`);
  lines.push(`    brand: ${JSON.stringify(rest.brand)},`);
  lines.push(`    category: ${JSON.stringify(rest.category)},`);
  lines.push(`    price: ${rest.price},`);
  lines.push(`    currency: "INR",`);
  if (rest.variants?.length) {
    lines.push(`    variants: ${JSON.stringify(rest.variants)},`);
  }
  lines.push(`    images: ${JSON.stringify(rest.images)},`);
  lines.push(`    description: ${JSON.stringify(rest.description)},`);
  lines.push(`    specs: ${JSON.stringify(rest.specs)},`);
  lines.push(`    compatibleCars: ${JSON.stringify(rest.compatibleCars)},`);
  lines.push(`  },`);
}
lines.push(`];`);
lines.push(``);

fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log("Wrote", out, "products:", products.length);
console.log("Build product picks:", JSON.stringify(buildPick, null, 2));
