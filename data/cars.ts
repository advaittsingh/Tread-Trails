import type { Car } from "./types";

export const cars: Car[] = [
  {
    id: "c1",
    slug: "toyota-hilux",
    name: "Toyota Hilux",
    tagline: "Unbreakable backbone.",
    description:
      "Lift kits, armor, and expedition-ready lighting engineered for serious terrain without sacrificing daily refinement.",
    heroImage: "/hilux/modified-toyota-hilux-5.jpg",
    thumbnail: "/hilux/toyota-hilux-modification-3-679f1cf4c10f47ec20605faf.jpg",
    category: "Pickup",
    engineSummary:
      "2.8L turbo-diesel (1GD-FTV) most regions · 2.4L diesel also listed in several markets.",
    modelYearsLabel: "2015–present (eighth generation)",
    trimSummary:
      "SR / SR5 / Rogue-style packs — cab (single / extra / double) and deck layouts vary by region.",
  },
  {
    id: "c2",
    slug: "mahindra-thar",
    name: "Mahindra Thar",
    tagline: "Born restless.",
    description:
      "Compact footprint. Maximum attitude. Suspension, traction aids, and protection packs tuned for rocks and rally stages alike.",
    heroImage: "/thar/modified-Mahindra-Thar-off-road.jpg",
    thumbnail: "/thar/Mahindra-Thar-Roxx.png",
    category: "SUV",
    engineSummary:
      "2.2L mStallion TGDi petrol · 2.2L diesel — gearbox options include MT / AT.",
    modelYearsLabel: "2020–present (second generation)",
    trimSummary: "LX / AX lines — factory option packs differ by model year.",
  },
  {
    id: "c3",
    slug: "toyota-fortuner",
    name: "Toyota Fortuner",
    tagline: "Full-size presence.",
    description:
      "Executive-grade interior meets expedition chassis tuning — touring suspension, auxiliary lighting, and premium rack systems.",
    heroImage: "/fortuner/Toyota-Fortuner-Darker-digital-render-img1.jpg",
    thumbnail: "/fortuner/no-textttttt-450x450.webp",
    category: "SUV",
    engineSummary:
      "2.8L diesel · 2.7L petrol — availability depends on market emissions rules.",
    modelYearsLabel: "2016–present (second generation facelift cycles)",
    trimSummary:
      "GX / GXL / Crusade tiering — naming and equipment grades vary regionally.",
  },
  {
    id: "c4",
    slug: "jeep-wrangler",
    name: "Jeep Wrangler",
    tagline: "Trail blueprint.",
    description:
      "The archetypal off-roader — lockers, rock sliders, and rooftop autonomy kits dialed for dunes and climbing alike.",
    heroImage: "/jeep-wrangler/Custom-Jeep-SUV-970x475.jpg",
    thumbnail: "/jeep-wrangler/Photo_17_04_24__10_32_27_AM.jpg",
    category: "4×4",
    engineSummary:
      "3.6L Pentastar V6 · 2.0L turbo · 392 V8 · 4xe plug-in hybrid — not all engines every market.",
    modelYearsLabel: "2018–present (JL generation)",
    trimSummary: "Sport / Sahara / Rubicon / Mojave / Willys-style packs by year.",
  },
  {
    id: "c5",
    slug: "land-rover-defender",
    name: "Land Rover Defender",
    tagline: "Modern expedition.",
    description:
      "Monocoque rigidity paired with modular racks, snorkels, and camp integrations built for crossing continents in silence.",
    heroImage: "/defender/card.jpg",
    thumbnail: "/defender/card.jpg",
    category: "SUV",
    engineSummary:
      "In-line 6 mild-hybrid petrol & diesel families (e.g. P400 / D300 badging) — specs vary by region.",
    modelYearsLabel: "2020–present (L663)",
    trimSummary: "90 / 110 / 130 wheelbases — HSE / X / Carpathian-style trims evolve yearly.",
  },
  {
    id: "c6",
    slug: "ford-bronco",
    name: "Ford Bronco",
    tagline: "Retro silhouette. Future grit.",
    description:
      "Removable panels and modular bumpers — we spec sway-bar disconnects, armor, and sand ladders for pure versatility.",
    heroImage: "/bronco/card.jpg",
    thumbnail: "/bronco/card.jpg",
    category: "SUV",
    engineSummary:
      "2.3L EcoBoost · 2.7L EcoBoost twin-turbo · 3.0L EcoBoost (Raptor) — transmission mixes include MT / AT.",
    modelYearsLabel: "2021–present (sixth generation)",
    trimSummary:
      "Base through Wildtrak / Everglades / Raptor — Sasquatch package availability varies.",
  },
];
