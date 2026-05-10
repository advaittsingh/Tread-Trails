import type { Prisma } from "@prisma/client";



import type { Product } from "@/data/types";
import { parseProductSpecificationsJson } from "@/lib/catalog/product-specifications";
import { parseProductVariantsJson } from "@/lib/catalog/product-variants";



/** Include vehicle slugs for DTO mapping (API + server catalog). */

export const productWithVehicleCompatInclude = {

  vehicleCompatibilities: {

    include: { vehicle: { select: { slug: true } } },

  },

} satisfies Prisma.ProductInclude;



export type ProductWithVehicleCompat = Prisma.ProductGetPayload<{

  include: typeof productWithVehicleCompatInclude;

}>;



/** Maps a Prisma Product row (+ compat join) to the client-facing Product shape. */

export function prismaProductToDTO(p: ProductWithVehicleCompat): Product {

  const compatibleCars = p.vehicleCompatibilities

    .map((c) => c.vehicle.slug)

    .sort();

  return {

    id: p.legacyId ?? p.id,

    slug: p.slug,

    name: p.name,

    brand: p.brand,

    category: p.category,

    price: p.price ?? undefined,

    currency: p.currency,

    images: p.images,

    description: p.description,

    specs: parseProductSpecificationsJson(p.specs),

    variants: parseProductVariantsJson(p.variants),

    compatibleCars,

  };

}


