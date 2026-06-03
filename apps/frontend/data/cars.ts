import type { Car } from "./types";
import { vehicleImagePaths } from "./vehicle-images";

type Hierarchy = {
  makeSlug: string;
  makeName: string;
  modelSlug: string;
  modelName: string;
  generationKey?: string;
};

function platform(
  id: string,
  slug: string,
  name: string,
  category: Car["category"],
  hierarchy: Hierarchy,
  fields: Pick<
    Car,
    "tagline" | "description" | "engineSummary" | "modelYearsLabel" | "trimSummary"
  >
): Car {
  const { heroImage, thumbnail } = vehicleImagePaths(slug);
  return {
    id,
    slug,
    name,
    category,
    heroImage,
    thumbnail,
    ...hierarchy,
    ...fields,
  };
}

const expeditionDesc =
  "Expedition-ready suspension, protection, lighting, and curated accessories — studio-fit for this chassis at Tread Trails.";

const toyota = (
  modelSlug: string,
  modelName: string,
  generationKey?: string
): Hierarchy => ({
  makeSlug: "toyota",
  makeName: "Toyota",
  modelSlug,
  modelName,
  ...(generationKey ? { generationKey } : {}),
});

const mahindra = (
  modelSlug: string,
  modelName: string,
  generationKey?: string
): Hierarchy => ({
  makeSlug: "mahindra",
  makeName: "Mahindra",
  modelSlug,
  modelName,
  ...(generationKey ? { generationKey } : {}),
});

/** India-market expedition & lifestyle 4×4 catalog (OEM → model line → generation → variant). */
export const cars: Car[] = [
  // —— Toyota ——
  platform(
    "c1",
    "toyota-hilux",
    "Hilux · 2.8L diesel (India)",
    "Pickup",
    toyota("hilux", "Hilux"),
    {
      tagline: "Unbreakable backbone.",
      description: expeditionDesc,
      engineSummary: "2.8L turbo-diesel (1GD-FTV) · 2.4L diesel in select markets.",
      modelYearsLabel: "2022–present (India launch · AN120)",
      trimSummary: "STD · Mid · High · GR-Sport — 4×4 double cab.",
    }
  ),
  platform(
    "c-f1",
    "toyota-fortuner-gen1",
    "Fortuner · 1st generation",
    "SUV",
    toyota("fortuner", "Fortuner", "gen1"),
    {
      tagline: "First-generation Fortuner for India.",
      description: expeditionDesc,
      engineSummary: "3.0L diesel · 2.7L petrol · 4.0L petrol (early imports).",
      modelYearsLabel: "2009–2015 (India CKD)",
      trimSummary: "2WD / 4×4 · 5-speed manual & automatic.",
    }
  ),
  platform(
    "c-f2",
    "toyota-fortuner-gen2",
    "Fortuner · 2nd generation",
    "SUV",
    toyota("fortuner", "Fortuner", "gen2"),
    {
      tagline: "Second-generation Fortuner.",
      description: expeditionDesc,
      engineSummary: "2.8L diesel · 2.7L petrol.",
      modelYearsLabel: "2016–2022 (India)",
      trimSummary: "4×2 · 4×4 · Fortuner TRD Sportivo packs.",
    }
  ),
  platform(
    "c-f3",
    "toyota-fortuner-gen3",
    "Fortuner · 3rd generation",
    "SUV",
    toyota("fortuner", "Fortuner", "gen3"),
    {
      tagline: "Current Fortuner in India.",
      description: expeditionDesc,
      engineSummary: "2.8L diesel · 2.7L NA petrol (discontinued) · 2.7L turbo-petrol.",
      modelYearsLabel: "2022–present (India)",
      trimSummary: "4×2 · 4×4 · GR-S · Legender · Neo Drive.",
    }
  ),
  platform(
    "c-p90",
    "toyota-land-cruiser-prado-90",
    "Land Cruiser Prado · 90 Series",
    "SUV",
    toyota("land-cruiser-prado", "Land Cruiser Prado", "90-series"),
    {
      tagline: "Compact Prado platform.",
      description: expeditionDesc,
      engineSummary: "3.0L petrol · 3.0L turbo-diesel (1KZ / 1KD).",
      modelYearsLabel: "1996–2002 (90 series)",
      trimSummary: "TX · TZ · VX — three-door and five-door.",
    }
  ),
  platform(
    "c-p120",
    "toyota-land-cruiser-prado-120",
    "Land Cruiser Prado · 120 Series",
    "SUV",
    toyota("land-cruiser-prado", "Land Cruiser Prado", "120-series"),
    {
      tagline: "Mid-size Prado evolution.",
      description: expeditionDesc,
      engineSummary: "2.7L petrol · 3.0L diesel.",
      modelYearsLabel: "2002–2009 (120 series)",
      trimSummary: "TX · VX · Kakadu-equivalent trims.",
    }
  ),
  platform(
    "c-p150",
    "toyota-land-cruiser-prado-150",
    "Land Cruiser Prado · 150 Series",
    "SUV",
    toyota("land-cruiser-prado", "Land Cruiser Prado", "150-series"),
    {
      tagline: "Modern Prado touring chassis.",
      description: expeditionDesc,
      engineSummary: "2.7L petrol · 2.8L diesel.",
      modelYearsLabel: "2009–2023 (150 series · India imports)",
      trimSummary: "GX · GXL · VX · Kakadu.",
    }
  ),
  platform(
    "c-lc80",
    "toyota-land-cruiser-80-series",
    "Land Cruiser · 80 Series",
    "SUV",
    toyota("land-cruiser", "Land Cruiser", "80-series"),
    {
      tagline: "Solid-axle Land Cruiser icon.",
      description: expeditionDesc,
      engineSummary: "4.2L diesel (1HZ) · 4.5L petrol (1FZ) · 4.2L turbo-diesel (1HD).",
      modelYearsLabel: "1990–1997 (80 series)",
      trimSummary: "GX · GXL · Sahara — locking diffs on select grades.",
    }
  ),
  platform(
    "c-lc100",
    "toyota-land-cruiser-100-series",
    "Land Cruiser · 100 Series",
    "SUV",
    toyota("land-cruiser", "Land Cruiser", "100-series"),
    {
      tagline: "V8 and straight-six touring rigs.",
      description: expeditionDesc,
      engineSummary: "4.2L diesel · 4.7L V8 petrol.",
      modelYearsLabel: "1998–2007 (100 series)",
      trimSummary: "GX · GXL · Sahara · VX.",
    }
  ),
  platform(
    "c-lc200",
    "toyota-land-cruiser-200-series",
    "Land Cruiser · 200 Series",
    "SUV",
    toyota("land-cruiser", "Land Cruiser", "200-series"),
    {
      tagline: "Flagship overland platform.",
      description: expeditionDesc,
      engineSummary: "4.5L V8 twin-turbo diesel · 4.6L V8 petrol.",
      modelYearsLabel: "2007–2021 (200 series)",
      trimSummary: "GX · GXL · VX · Sahara.",
    }
  ),
  platform(
    "c-lc300",
    "toyota-land-cruiser-300-series",
    "Land Cruiser · 300 Series",
    "SUV",
    toyota("land-cruiser", "Land Cruiser", "300-series"),
    {
      tagline: "Current Land Cruiser flagship.",
      description: expeditionDesc,
      engineSummary: "3.3L V6 twin-turbo diesel · 3.5L twin-turbo V6 petrol.",
      modelYearsLabel: "2021–present (300 series)",
      trimSummary: "GX · VX · Sahara · GR Sport.",
    }
  ),

  // —— Isuzu ——
  platform(
    "c-dmax-25",
    "isuzu-d-max-v-cross-2500cc",
    "D-Max V-Cross · 2.5L diesel",
    "Pickup",
    {
      makeSlug: "isuzu",
      makeName: "Isuzu",
      modelSlug: "d-max",
      modelName: "D-Max V-Cross",
    },
    {
      tagline: "Proven 2.5L diesel pickup.",
      description: expeditionDesc,
      engineSummary: "2.5L turbo-diesel · 134 bhp / 360 Nm (India spec).",
      modelYearsLabel: "2016–2019 (prior V-Cross generation)",
      trimSummary: "V-Cross · V-Cross 4×4 · Z · Z Prestige.",
    }
  ),
  platform(
    "c-dmax-19",
    "isuzu-d-max-v-cross-1900cc",
    "D-Max V-Cross · 1.9L diesel",
    "Pickup",
    {
      makeSlug: "isuzu",
      makeName: "Isuzu",
      modelSlug: "d-max",
      modelName: "D-Max V-Cross",
      generationKey: "rz4e",
    },
    {
      tagline: "Current D-Max V-Cross in India.",
      description: expeditionDesc,
      engineSummary: "1.9L RZ4E-TC turbo-diesel · 162 bhp / 360 Nm.",
      modelYearsLabel: "2020–present (India)",
      trimSummary: "V-Cross · V-Cross Z · V-Cross Z Prestige · 4×4.",
    }
  ),

  // —— Mahindra ——
  platform(
    "c-thar-g1",
    "mahindra-thar-gen1-crde",
    "Thar · 1st generation (CRDe)",
    "4×4",
    mahindra("thar", "Thar", "gen1"),
    {
      tagline: "Original Thar ladder frame.",
      description: expeditionDesc,
      engineSummary: "2.5L CRDe diesel · 2.6L petrol · 2.2L mHawk diesel.",
      modelYearsLabel: "2010–2020 (India)",
      trimSummary: "DI · CRDe · soft-top and hard-top.",
    }
  ),
  platform(
    "c2",
    "mahindra-thar",
    "Thar · 2nd generation",
    "4×4",
    mahindra("thar", "Thar", "gen2"),
    {
      tagline: "Born restless.",
      description: expeditionDesc,
      engineSummary: "2.2L mStallion TGDi petrol · 2.2L mHawk diesel.",
      modelYearsLabel: "2020–present (India)",
      trimSummary: "AX (O) · LX · hard-top · convertible · RWD/4×4.",
    }
  ),
  platform(
    "c-roxx",
    "mahindra-thar-roxx",
    "Thar Roxx · 5-door",
    "SUV",
    mahindra("thar-roxx", "Thar Roxx"),
    {
      tagline: "Five-door Thar architecture.",
      description: expeditionDesc,
      engineSummary: "2.0L turbo-petrol · 2.2L diesel.",
      modelYearsLabel: "2024–present (India)",
      trimSummary: "AX · AX5L · AX7L · AX7L Luxury.",
    }
  ),
  platform(
    "c-scorpio-c",
    "mahindra-scorpio-classic",
    "Scorpio Classic",
    "SUV",
    mahindra("scorpio", "Scorpio"),
    {
      tagline: "Body-on-frame Scorpio lineage.",
      description: expeditionDesc,
      engineSummary: "2.2L mHawk diesel · 2.0L turbo-petrol.",
      modelYearsLabel: "2022–present (Classic refresh · India)",
      trimSummary: "S4 · S6 · S11 · S11 Adventure.",
    }
  ),
  platform(
    "c-scorpion",
    "mahindra-scorpio-n",
    "Scorpio N",
    "SUV",
    mahindra("scorpio-n", "Scorpio N"),
    {
      tagline: "Modern Scorpio platform.",
      description: expeditionDesc,
      engineSummary: "2.0L turbo-petrol · 2.2L diesel.",
      modelYearsLabel: "2022–present (India)",
      trimSummary: "Z2 · Z4 · Z6 · Z8 · Z8L · Z8L Adventure.",
    }
  ),
  platform(
    "c-gurkha",
    "force-gurkha",
    "Gurkha · Xpedition / Xplorer",
    "4×4",
    {
      makeSlug: "force",
      makeName: "Force",
      modelSlug: "gurkha",
      modelName: "Gurkha",
    },
    {
      tagline: "Purpose-built ladder frame.",
      description: expeditionDesc,
      engineSummary: "2.6L diesel (Mercedes OM616-derived).",
      modelYearsLabel: "Current generation (India)",
      trimSummary: "Xpedition · Xplorer — 3-door and 5-door.",
    }
  ),

  // —— Maruti Suzuki ——
  platform(
    "c-jimny",
    "maruti-suzuki-jimny",
    "Jimny · 5-door (India)",
    "4×4",
    {
      makeSlug: "maruti-suzuki",
      makeName: "Maruti Suzuki",
      modelSlug: "jimny",
      modelName: "Jimny",
    },
    {
      tagline: "Lightweight mountain goat.",
      description: expeditionDesc,
      engineSummary: "1.5L K15B petrol (India spec).",
      modelYearsLabel: "2024–present (JB74 · India)",
      trimSummary: "Zeta · Alpha — 4×4 automatic.",
    }
  ),
  platform(
    "c-gypsy",
    "maruti-gypsy",
    "Gypsy",
    "4×4",
    {
      makeSlug: "maruti-suzuki",
      makeName: "Maruti Suzuki",
      modelSlug: "gypsy",
      modelName: "Gypsy",
    },
    {
      tagline: "Legacy lightweight 4×4.",
      description: expeditionDesc,
      engineSummary: "1.3L G13B petrol · 1.6L King.",
      modelYearsLabel: "1985–2019 (India · discontinued)",
      trimSummary: "ST · King · soft-top and hard-top.",
    }
  ),

  // —— Mitsubishi ——
  platform(
    "c-pajero-glx",
    "mitsubishi-pajero-glx-sfx",
    "Pajero · GLX / SFX (Montero)",
    "SUV",
    {
      makeSlug: "mitsubishi",
      makeName: "Mitsubishi",
      modelSlug: "pajero",
      modelName: "Pajero / Montero",
    },
    {
      tagline: "Montero heritage in India.",
      description: expeditionDesc,
      engineSummary: "2.8L diesel · 3.2L diesel · 3.5L V6 petrol.",
      modelYearsLabel: "1990s–2010s (India · V20 / V40 families)",
      trimSummary: "GLX · GLS · SFX — SWB and LWB.",
    }
  ),
  platform(
    "c-pajero-sport",
    "mitsubishi-pajero-sport",
    "Pajero Sport",
    "SUV",
    {
      makeSlug: "mitsubishi",
      makeName: "Mitsubishi",
      modelSlug: "pajero-sport",
      modelName: "Pajero Sport",
    },
    {
      tagline: "Ladder-frame sport SUV.",
      description: expeditionDesc,
      engineSummary: "2.4L MIVEC petrol · 2.4L diesel.",
      modelYearsLabel: "2012–present (India · third generation)",
      trimSummary: " GLX · Adventure · Select Plus · 4×4.",
    }
  ),

  // —— Jeep ——
  platform(
    "c-jk",
    "jeep-wrangler-jk",
    "Wrangler · JK",
    "4×4",
    {
      makeSlug: "jeep",
      makeName: "Jeep",
      modelSlug: "wrangler",
      modelName: "Wrangler",
      generationKey: "jk",
    },
    {
      tagline: "JK-era trail blueprint.",
      description: expeditionDesc,
      engineSummary: "3.6L Pentastar V6 · 2.8L diesel (limited India CBU).",
      modelYearsLabel: "2016–2018 (India CBU window)",
      trimSummary: "Sport · Sahara · Rubicon.",
    }
  ),
  platform(
    "c-jl",
    "jeep-wrangler-jl",
    "Wrangler · JL",
    "4×4",
    {
      makeSlug: "jeep",
      makeName: "Jeep",
      modelSlug: "wrangler",
      modelName: "Wrangler",
      generationKey: "jl",
    },
    {
      tagline: "Current Wrangler in India.",
      description: expeditionDesc,
      engineSummary: "2.0L turbo petrol · 3.6L V6 (import spec).",
      modelYearsLabel: "2020–present (India CBU)",
      trimSummary: "Sport · Sahara · Rubicon.",
    }
  ),

  // —— Ford ——
  platform(
    "c-endeavour-32",
    "ford-endeavour-3200cc",
    "Endeavour · 3.2L TDCi",
    "SUV",
    {
      makeSlug: "ford",
      makeName: "Ford",
      modelSlug: "endeavour",
      modelName: "Endeavour",
      generationKey: "tdci-32",
    },
    {
      tagline: "Torque-rich Endeavour diesel.",
      description: expeditionDesc,
      engineSummary: "3.2L TDCi five-cylinder diesel · 197 bhp.",
      modelYearsLabel: "2015–2022 (India · third-gen facelift)",
      trimSummary: "Trend · Titanium · Titanium+ · 4×4.",
    }
  ),
  platform(
    "c-endeavour-20",
    "ford-endeavour-2000cc-10speed",
    "Endeavour · 2.0L Bi-Turbo",
    "SUV",
    {
      makeSlug: "ford",
      makeName: "Ford",
      modelSlug: "endeavour",
      modelName: "Endeavour",
      generationKey: "biturbo-20",
    },
    {
      tagline: "Bi-turbo Endeavour touring rig.",
      description: expeditionDesc,
      engineSummary: "2.0L Bi-Turbo diesel · 10-speed automatic · 210 bhp.",
      modelYearsLabel: "2019–2022 (India · prior to Ford exit)",
      trimSummary: "Sport · Titanium · Titanium+ · 4×4.",
    }
  ),
];
