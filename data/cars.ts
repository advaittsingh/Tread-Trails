import type { Car } from "./types";
import { vehicleImagePaths } from "./vehicle-images";

function platform(
  id: string,
  slug: string,
  name: string,
  category: Car["category"],
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
    ...fields,
  };
}

const expeditionDesc =
  "Expedition-ready suspension, protection, lighting, and curated accessories — studio-fit for this chassis at Tread Trails.";

export const cars: Car[] = [
  platform("c1", "toyota-hilux", "Toyota Hilux", "Pickup", {
    tagline: "Unbreakable backbone.",
    description: expeditionDesc,
    engineSummary:
      "2.8L turbo-diesel (1GD-FTV) · 2.4L diesel in select markets.",
    modelYearsLabel: "2015–present (eighth generation)",
    trimSummary:
      "SR / SR5 / Rogue-style packs — single, extra, and double cab layouts vary by region.",
  }),

  platform("c-f1", "toyota-fortuner-gen1", "Toyota Fortuner (Gen 1)", "SUV", {
    tagline: "First-generation full-size SUV.",
    description: expeditionDesc,
    engineSummary: "2.7L petrol · 3.0L diesel — market and year dependent.",
    modelYearsLabel: "2004–2015 (first generation)",
    trimSummary: "GX / GXL / VX tiering by market.",
  }),
  platform("c-f2", "toyota-fortuner-gen2", "Toyota Fortuner (Gen 2)", "SUV", {
    tagline: "Full-size presence.",
    description: expeditionDesc,
    engineSummary: "2.8L diesel · 2.7L petrol.",
    modelYearsLabel: "2015–2022 (second generation)",
    trimSummary: "GX / GXL / Crusade — regional naming varies.",
  }),
  platform("c-f3", "toyota-fortuner-gen3", "Toyota Fortuner (Gen 3)", "SUV", {
    tagline: "Current-generation Fortuner.",
    description: expeditionDesc,
    engineSummary: "2.8L diesel · 2.7L turbo-petrol (market dependent).",
    modelYearsLabel: "2022–present (third generation)",
    trimSummary: "GX / GXL / Crusade / GR Sport where offered.",
  }),

  platform(
    "c-p90",
    "toyota-land-cruiser-prado-90",
    "Toyota Land Cruiser Prado (90 Series)",
    "SUV",
    {
      tagline: "Compact Prado platform.",
      description: expeditionDesc,
      engineSummary: "3.0L petrol · 3.0L turbo-diesel (1KZ / 1KD families).",
      modelYearsLabel: "1996–2002 (90 series)",
      trimSummary: "TX / TZ / VX — three-door and five-door bodies.",
    }
  ),
  platform(
    "c-p120",
    "toyota-land-cruiser-prado-120",
    "Toyota Land Cruiser Prado (120 Series)",
    "SUV",
    {
      tagline: "Mid-size Prado evolution.",
      description: expeditionDesc,
      engineSummary: "2.7L petrol · 3.0L diesel.",
      modelYearsLabel: "2002–2009 (120 series)",
      trimSummary: "TX / VX / Kakadu-equivalent trims by region.",
    }
  ),
  platform(
    "c-p150",
    "toyota-land-cruiser-prado-150",
    "Toyota Land Cruiser Prado (150 Series)",
    "SUV",
    {
      tagline: "Modern Prado touring chassis.",
      description: expeditionDesc,
      engineSummary: "2.7L petrol · 2.8L diesel.",
      modelYearsLabel: "2009–2023 (150 series)",
      trimSummary: "GX / GXL / VX / Kakadu — equipment grades vary.",
    }
  ),

  platform(
    "c-lc80",
    "toyota-land-cruiser-80-series",
    "Toyota Land Cruiser (80 Series)",
    "SUV",
    {
      tagline: "Solid-axle Land Cruiser icon.",
      description: expeditionDesc,
      engineSummary: "4.2L diesel (1HZ) · 4.5L petrol (1FZ) · 4.2L turbo-diesel (1HD).",
      modelYearsLabel: "1990–1997 (80 series)",
      trimSummary: "GX / GXL / Sahara — locking diffs on select grades.",
    }
  ),
  platform(
    "c-lc100",
    "toyota-land-cruiser-100-series",
    "Toyota Land Cruiser (100 Series)",
    "SUV",
    {
      tagline: "V8 and straight-six touring rigs.",
      description: expeditionDesc,
      engineSummary: "4.2L diesel · 4.7L V8 petrol.",
      modelYearsLabel: "1998–2007 (100 series)",
      trimSummary: "GX / GXL / Sahara / VX.",
    }
  ),
  platform(
    "c-lc200",
    "toyota-land-cruiser-200-series",
    "Toyota Land Cruiser (200 Series)",
    "SUV",
    {
      tagline: "Flagship overland platform.",
      description: expeditionDesc,
      engineSummary: "4.5L V8 twin-turbo diesel · 4.6L V8 petrol.",
      modelYearsLabel: "2007–2021 (200 series)",
      trimSummary: "GX / GXL / VX / Sahara.",
    }
  ),
  platform(
    "c-lc300",
    "toyota-land-cruiser-300-series",
    "Toyota Land Cruiser (300 Series)",
    "SUV",
    {
      tagline: "Current Land Cruiser flagship.",
      description: expeditionDesc,
      engineSummary: "3.3L V6 twin-turbo diesel · 3.5L twin-turbo V6 petrol.",
      modelYearsLabel: "2021–present (300 series)",
      trimSummary: "GX / VX / Sahara / GR Sport.",
    }
  ),

  platform(
    "c-dmax-25",
    "isuzu-d-max-v-cross-2500cc",
    "Isuzu D-Max V-Cross (2.5L)",
    "Pickup",
    {
      tagline: "Light-duty diesel pickup.",
      description: expeditionDesc,
      engineSummary: "2.5L turbo-diesel.",
      modelYearsLabel: "D-Max / V-Cross generations vary by market year.",
      trimSummary: "V-Cross adventure trim — 4×4 double cab.",
    }
  ),
  platform(
    "c-dmax-19",
    "isuzu-d-max-v-cross-1900cc",
    "Isuzu D-Max V-Cross (1.9L)",
    "Pickup",
    {
      tagline: "Efficient diesel pickup platform.",
      description: expeditionDesc,
      engineSummary: "1.9L turbo-diesel (RZ4E).",
      modelYearsLabel: "2019–present (current D-Max generation)",
      trimSummary: "V-Cross · standard and adventure packs.",
    }
  ),

  platform(
    "c-thar-g1",
    "mahindra-thar-gen1-crde",
    "Mahindra Thar (Gen 1 · CRDe)",
    "4×4",
    {
      tagline: "Original Thar ladder frame.",
      description: expeditionDesc,
      engineSummary: "2.5L CRDe diesel · 2.6L petrol (early) · 2.2L mHawk diesel (later).",
      modelYearsLabel: "2010–2020 (first generation)",
      trimSummary: "DI / CRDe soft-top and hard-top bodies.",
    }
  ),
  platform("c2", "mahindra-thar", "Mahindra Thar (Gen 2 · 2020+)", "4×4", {
    tagline: "Born restless.",
    description: expeditionDesc,
    engineSummary: "2.2L mStallion TGDi petrol · 2.2L diesel.",
    modelYearsLabel: "2020–present (second generation)",
    trimSummary: "AX / LX lines — hard-top, convertible, and Roxx-adjacent packs.",
  }),
  platform("c-roxx", "mahindra-thar-roxx", "Mahindra Thar Roxx", "SUV", {
    tagline: "Five-door Thar architecture.",
    description: expeditionDesc,
    engineSummary: "2.0L turbo-petrol · 2.2L diesel.",
    modelYearsLabel: "2024–present",
    trimSummary: "AX / AX5L / AX7L — factory adventure packs.",
  }),

  platform(
    "c-scorpio-c",
    "mahindra-scorpio-classic",
    "Mahindra Scorpio Classic",
    "SUV",
    {
      tagline: "Body-on-frame Scorpio lineage.",
      description: expeditionDesc,
      engineSummary: "2.2L mHawk diesel · 2.0L turbo-petrol on newer builds.",
      modelYearsLabel: "Classic / refreshed Classic — check build year",
      trimSummary: "S4 · S6 · S11 — feature packs vary.",
    }
  ),
  platform("c-scorpion", "mahindra-scorpio-n", "Mahindra Scorpio N", "SUV", {
    tagline: "Modern Scorpio platform.",
    description: expeditionDesc,
    engineSummary: "2.0L turbo-petrol · 2.2L diesel.",
    modelYearsLabel: "2022–present",
    trimSummary: "Z2 · Z4 · Z8 · Z8L.",
  }),

  platform("c-gurkha", "force-gurkha", "Force Gurkha", "4×4", {
    tagline: "Purpose-built ladder frame.",
    description: expeditionDesc,
    engineSummary: "2.6L diesel (Mercedes OM616-derived family).",
    modelYearsLabel: "Current generation expedition trim",
    trimSummary: "Xpedition · Xplorer — three-door and five-door.",
  }),

  platform("c-jimny", "maruti-suzuki-jimny", "Maruti Suzuki Jimny", "4×4", {
    tagline: "Lightweight mountain goat.",
    description: expeditionDesc,
    engineSummary: "1.5L K15B petrol (India spec).",
    modelYearsLabel: "2018–present (JB74 / fourth generation)",
    trimSummary: "Zeta · Alpha — 3-door body.",
  }),

  platform("c-gypsy", "maruti-gypsy", "Maruti Gypsy", "4×4", {
    tagline: "Legacy lightweight 4×4.",
    description: expeditionDesc,
    engineSummary: "1.3L G13B petrol (classic) · 1.6L on King / later builds.",
    modelYearsLabel: "1985–2019 (Indian market lineage)",
    trimSummary: "ST · King · soft-top and hard-top.",
  }),

  platform(
    "c-pajero-glx",
    "mitsubishi-pajero-glx-sfx",
    "Mitsubishi Pajero (GLX & SFX)",
    "SUV",
    {
      tagline: "Montero / Pajero heritage SUV.",
      description: expeditionDesc,
      engineSummary: "2.8L diesel · 3.2L diesel · 3.5L V6 petrol (generation dependent).",
      modelYearsLabel: "V20 / V40 / V60 families — confirm series for your VIN",
      trimSummary: "GLX · GLS · SFX — long-wheelbase and short-wheelbase.",
    }
  ),
  platform(
    "c-pajero-sport",
    "mitsubishi-pajero-sport",
    "Mitsubishi Pajero Sport",
    "SUV",
    {
      tagline: "Ladder-frame sport SUV.",
      description: expeditionDesc,
      engineSummary: "2.4L MIVEC petrol · 2.4L diesel.",
      modelYearsLabel: "2015–present (third generation in India)",
      trimSummary: " GLX · Adventure · Select Plus.",
    }
  ),

  platform("c-jk", "jeep-wrangler-jk", "Jeep Wrangler (JK)", "4×4", {
    tagline: "JK-era trail blueprint.",
    description: expeditionDesc,
    engineSummary: "3.6L Pentastar V6 · 2.8L diesel (market dependent).",
    modelYearsLabel: "2006–2018 (JK)",
    trimSummary: "Sport · Sahara · Rubicon.",
  }),
  platform("c-jl", "jeep-wrangler-jl", "Jeep Wrangler (JL)", "4×4", {
    tagline: "Current Wrangler generation.",
    description: expeditionDesc,
    engineSummary:
      "3.6L V6 · 2.0L turbo · 392 V8 · 4xe plug-in — market dependent.",
    modelYearsLabel: "2018–present (JL)",
    trimSummary: "Sport · Sahara · Rubicon · Mojave.",
  }),

  platform(
    "c-endeavour-32",
    "ford-endeavour-3200cc",
    "Ford Endeavour (3.2L)",
    "SUV",
    {
      tagline: "Torque-rich Endeavour diesel.",
      description: expeditionDesc,
      engineSummary: "3.2L TDCi five-cylinder diesel.",
      modelYearsLabel: "2015–2022 (third generation facelift window)",
      trimSummary: "Trend · Titanium · Titanium+.",
    }
  ),
  platform(
    "c-endeavour-20",
    "ford-endeavour-2000cc-10speed",
    "Ford Endeavour (2.0L · 10-speed)",
    "SUV",
    {
      tagline: "Bi-turbo Endeavour touring rig.",
      description: expeditionDesc,
      engineSummary: "2.0L Bi-Turbo diesel · 10-speed automatic.",
      modelYearsLabel: "2019–present (current generation)",
      trimSummary: "Sport · Titanium · Titanium+.",
    }
  ),

  platform(
    "c-armoured",
    "armoured-special-utility",
    "Armoured & special utility",
    "Armoured & special utility",
    {
      tagline: "Bespoke protection platforms.",
      description:
        "Armoured conversions, VIP mobility, and special-mission utility vehicles — contact the studio for chassis-specific engineering and compliance.",
      engineSummary: "Platform-specific — quoted per build.",
      modelYearsLabel: "By commission",
      trimSummary:
        "Ballistic and blast protection · emergency services · cash-in-transit · custom utility.",
    }
  ),

  platform("c-rest-bmw", "restoration-bmw", "Restoration · BMW", "Restoration", {
    tagline: "BMW restoration programs.",
    description:
      "Ground-up and selective restoration for classic BMW platforms — mechanical refresh, period-correct interiors, and modern safety integration.",
    engineSummary: "Model-specific — studio consultation.",
    modelYearsLabel: "Classic and modern classic BMW",
    trimSummary: "E30 / E36 / E39 / E46 and bespoke commissions.",
  }),
  platform(
    "c-rest-chev",
    "restoration-chevrolet",
    "Restoration · Chevrolet",
    "Restoration",
    {
      tagline: "Chevrolet restoration programs.",
      description:
        "American icon restorations — frame-off and sympathetic refreshes with expedition or street finishes.",
      engineSummary: "Small-block and LS families — per project.",
      modelYearsLabel: "Classic Chevrolet trucks and SUVs",
      trimSummary: "C10 · Blazer · Suburban-class builds.",
    }
  ),
  platform(
    "c-rest-mb",
    "restoration-mercedes-benz",
    "Restoration · Mercedes-Benz",
    "Restoration",
    {
      tagline: "Mercedes-Benz restoration programs.",
      description:
        "G-Wagen lineage, saloons, and classics — OEM-faithful or restomod expedition outcomes.",
      engineSummary: "Model-specific — quoted per chassis.",
      modelYearsLabel: "Mercedes-Benz classic and modern classic",
      trimSummary: "G-Class · W123 / W124 era · bespoke commissions.",
    }
  ),
  platform(
    "c-rest-dodge",
    "restoration-dodge",
    "Restoration · Dodge",
    "Restoration",
    {
      tagline: "Dodge restoration programs.",
      description:
        "Muscle and truck restoration with modern brakes, cooling, and overland-ready finishes where requested.",
      engineSummary: "Hemi and Magnum families — per project.",
      modelYearsLabel: "Classic Dodge trucks and performance cars",
      trimSummary: "Power Wagon lineage · Challenger / Charger restomods.",
    }
  ),
  platform(
    "c-rest-porsche",
    "restoration-porsche",
    "Restoration · Porsche",
    "Restoration",
    {
      tagline: "Porsche restoration programs.",
      description:
        "Air-cooled and early water-cooled Porsche — mechanical rebuilds, interior retrim, and rally or touring spec.",
      engineSummary: "Flat-six and flat-four — model-specific.",
      modelYearsLabel: "911 · 912 · 914 and related classics",
      trimSummary: "SC · Carrera · RS-inspired builds.",
    }
  ),
];
