export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;

export const MEDIA_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const MEDIA_FOLDERS = [
  "uploads",
  "products",
  "vehicles",
  "brands",
  "builds",
  "marketing",
] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const MEDIA_FOLDER_LABELS: Record<MediaFolder, string> = {
  uploads: "General uploads",
  products: "Products",
  vehicles: "Vehicles",
  brands: "Brands",
  builds: "Builds",
  marketing: "Marketing",
};
