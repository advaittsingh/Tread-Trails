import type { Prisma } from "@prisma/client";
import type { Product } from "@tread-trails/shared-types";

import { parseProductSpecificationsJson } from "./product-specifications.js";
import { parseProductVariantsJson } from "./product-variants.js";

export const productWithVehicleCompatInclude = {
  vehicleCompatibilities: {
    include: { vehicle: { select: { slug: true } } },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithVehicleCompat = Prisma.ProductGetPayload<{
  include: typeof productWithVehicleCompatInclude;
}>;

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
