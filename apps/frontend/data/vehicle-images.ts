/** Local paths under `public/vehicles/{slug}/` (sourced from Wikimedia Commons). */
export function vehicleImagePaths(slug: string): {
  heroImage: string;
  thumbnail: string;
} {
  return {
    heroImage: `/vehicles/${slug}/hero.jpg`,
    thumbnail: `/vehicles/${slug}/thumb.jpg`,
  };
}
