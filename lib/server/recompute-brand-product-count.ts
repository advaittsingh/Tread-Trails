import { prisma } from "@/lib/prisma";

/** Recompute `Brand.productCount` from catalog rows matching `brand.name`. */
export async function recomputeBrandProductCount(brandId: string): Promise<number> {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) return 0;

  const count = await prisma.product.count({
    where: { brand: { equals: brand.name, mode: "insensitive" } },
  });

  await prisma.brand.update({
    where: { id: brandId },
    data: { productCount: count },
  });

  return count;
}
