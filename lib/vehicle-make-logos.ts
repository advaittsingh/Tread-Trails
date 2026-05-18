/** OEM wordmarks served from `public/oem-logos/` (Wikimedia Commons / brand assets). */
const VEHICLE_MAKE_LOGOS: Record<string, string> = {
  ford: "/oem-logos/ford.svg",
  force: "/oem-logos/force.svg",
  isuzu: "/oem-logos/isuzu.svg",
  jeep: "/oem-logos/jeep.svg",
  mahindra: "/oem-logos/mahindra.svg",
  maruti: "/oem-logos/maruti-suzuki.svg",
  "maruti-suzuki": "/oem-logos/maruti-suzuki.svg",
  mitsubishi: "/oem-logos/mitsubishi.svg",
  toyota: "/oem-logos/toyota.svg",
};

export function getVehicleMakeLogoSrc(makeSlug: string): string | undefined {
  return VEHICLE_MAKE_LOGOS[makeSlug];
}
