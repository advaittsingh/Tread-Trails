import type { Build } from "./types";

export const builds: Build[] = [
  {
    id: "b1",
    slug: "hilux-arctic-runner",
    title: "Arctic Runner Hilux",
    vehicleSlug: "toyota-hilux",
    summary: "Sub-zero rated auxiliary stack with touring suspension.",
    description:
      "We rebuilt this Hilux around thermal stability — isolated reservoir shocks, heated auxiliary harnessing, and redundant filtration for multi-week expeditions.",
    beforeImage: "/hilux/toyota-hilux-modification-3-679f1cf4c10f47ec20605faf.jpg",
    afterImage: "/hilux/modified-toyota-hilux-5.jpg",
    gallery: [
      "/hilux/modified-toyota-hilux-5.jpg",
      "/hilux/Fire4X4-Front-Bumper-for-Toyota-Hilux2-1-600x600.webp",
      "/hilux/toyota0.avif",
    ],
    productIds: ["p10", "p5", "p43", "p44"],
    homeSpotlightRank: 1,
  },
  {
    id: "b2",
    slug: "thar-monolith-edition",
    title: "Monolith Thar",
    vehicleSlug: "mahindra-thar",
    summary: "Armor-forward stance with precision lighting geometry.",
    description:
      "Rock sliders tie directly into the ladder frame while LED pods hug A-pillars — daylight symmetry preserved by recessed bezels.",
    beforeImage: "/thar/THAR.jpg",
    afterImage: "/thar/modified-Mahindra-Thar-off-road.jpg",
    gallery: [
      "/thar/modified-Mahindra-Thar-off-road.jpg",
      "/thar/Mahindra-Thar-Roxx.png",
      "/thar/1_110.jpg",
    ],
    productIds: ["p49", "p31", "p9"],
    homeSpotlightRank: 2,
  },
  {
    id: "b3",
    slug: "wrangler-vector-nightfall",
    title: "Nightfall Wrangler",
    vehicleSlug: "jeep-wrangler-jk",
    summary: "Locked differentials, synthetic recovery, long-travel damping.",
    description:
      "This JK-era platform runs our Vector suspension paired with Cipher locker logic — controlled aggression with predictable yaw.",
    beforeImage: "/jeep-wrangler/Photo_17_04_24__10_32_27_AM.jpg",
    afterImage: "/jeep-wrangler/Custom-Jeep-SUV-970x475.jpg",
    gallery: [
      "/jeep-wrangler/Custom-Jeep-SUV-970x475.jpg",
      "/jeep-wrangler/2024-Jeep-Wrangler-Rubicon-31-900x506.avif",
      "/jeep-wrangler/20240425100256_Jeep%20Wrangler%20Web%20Resized%20and%20Watermarked.009.avif",
    ],
    productIds: ["p10", "p50", "p49", "p9"],
    homeSpotlightRank: 3,
  },
  {
    id: "b4",
    slug: "defender-helios-expedition",
    title: "Helios Expedition Cruiser",
    vehicleSlug: "toyota-land-cruiser-300-series",
    summary: "Silent touring rack + snorkel + layered lighting.",
    description:
      "Camp-forward ergonomics — dual-zone lighting lets rear occupants configure flood without blinding forward optics.",
    beforeImage: "/fortuner/Toyota-Fortuner-Darker-digital-render-img1.jpg",
    afterImage: "/defender/card.jpg",
    gallery: [
      "/defender/card.jpg",
      "/fortuner/DSC_0582.jpg",
      "/fortuner/no-textttttt-450x450.webp",
    ],
    productIds: ["p10", "p43", "p47"],
  },
  {
    id: "b5",
    slug: "bronco-dune-vector",
    title: "Vector Dune Endeavour",
    vehicleSlug: "ford-endeavour-3200cc",
    summary: "Sand modes unlocked through suspension stroke + traction.",
    description:
      "We lengthen rebound windows for loaded dunes while preserving turn-in on packed gravel — winch tucked behind satin skid.",
    beforeImage: "/fortuner/download.jpeg",
    afterImage: "/bronco/card.jpg",
    gallery: [
      "/bronco/card.jpg",
      "/jeep-wrangler/Custom-Jeep-SUV-970x475.jpg",
      "/fortuner/Toyota_Fortuner_custom_1665988101342_1665988260879_1665988260879.webp",
    ],
    productIds: ["p10", "p48", "p43", "p5"],
  },
  {
    id: "b6",
    slug: "fortuner-summit-suite",
    title: "Summit Suite Fortuner",
    vehicleSlug: "toyota-fortuner-gen2",
    summary: "Executive interior aura with roof autonomy.",
    description:
      "Rear-seat thermal zoning retained — rack accepts flush solar without piercing OEM drip rails.",
    beforeImage: "/fortuner/download.jpeg",
    afterImage: "/fortuner/Toyota-Fortuner-Darker-digital-render-img1.jpg",
    gallery: [
      "/fortuner/Toyota_Fortuner_custom_1665988101342_1665988260879_1665988260879.webp",
      "/fortuner/DSC_0582.jpg",
      "/fortuner/no-textttttt-450x450.webp",
    ],
    productIds: ["p16", "p43", "p51"],
  },
];
