function titleCase(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const OEM_MAKE_PREFIXES = [
  "maruti-suzuki",
  "toyota",
  "mahindra",
  "mitsubishi",
  "ford",
  "jeep",
  "isuzu",
  "force",
] as const;

/** Parse slug like `toyota-fortuner-gen1` → make, model, generation. */
export function parseVehicleSlug(slug: string): {
  makeSlug: string;
  modelSlug: string;
  generationKey: string | null;
} | null {
  const prefixes = [...OEM_MAKE_PREFIXES].sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (slug === prefix) {
      return { makeSlug: prefix, modelSlug: "platform", generationKey: null };
    }
    if (!slug.startsWith(`${prefix}-`)) continue;

    const rest = slug.slice(prefix.length + 1);
    if (!rest) return null;

    const parts = rest.split("-").filter(Boolean);
    const last = parts[parts.length - 1]!;
    const hasGen = /^gen\d+$/i.test(last) || /^\d+-series$/i.test(last);

    if (hasGen && parts.length >= 2) {
      return {
        makeSlug: prefix,
        modelSlug: parts.slice(0, -1).join("-"),
        generationKey: last.toLowerCase(),
      };
    }

    return {
      makeSlug: prefix,
      modelSlug: rest,
      generationKey: null,
    };
  }

  return null;
}

export function vehicleMakeDisplayName(makeSlug: string): string {
  const labels: Record<string, string> = {
    toyota: "Toyota",
    mahindra: "Mahindra",
    jeep: "Jeep",
    mitsubishi: "Mitsubishi",
    ford: "Ford",
    isuzu: "Isuzu",
    force: "Force",
    "maruti-suzuki": "Maruti Suzuki",
    maruti: "Maruti Suzuki",
  };
  return labels[makeSlug] ?? titleCase(makeSlug);
}

export function vehicleModelDisplayName(modelSlug: string): string {
  const labels: Record<string, string> = {
    hilux: "Hilux",
    fortuner: "Fortuner",
    "land-cruiser-prado": "Land Cruiser Prado",
    "land-cruiser": "Land Cruiser",
    "d-max": "D-Max V-Cross",
    thar: "Thar",
    "thar-roxx": "Thar Roxx",
    scorpio: "Scorpio",
    "scorpio-n": "Scorpio N",
    gurkha: "Gurkha",
    jimny: "Jimny",
    gypsy: "Gypsy",
    pajero: "Pajero / Montero",
    "pajero-sport": "Pajero Sport",
    wrangler: "Wrangler",
    endeavour: "Endeavour",
  };
  return labels[modelSlug] ?? titleCase(modelSlug);
}

/** Idempotent backfill of VehicleMake / VehicleModel from existing Vehicle slugs. */
export async function backfillVehicleHierarchyFromSlugs(): Promise<{
  makes: number;
  models: number;
  linked: number;
}> {
  // Phase 5: storefront no longer mutates DB; keep this as a no-op placeholder.
  return { makes: 0, models: 0, linked: 0 };
}
