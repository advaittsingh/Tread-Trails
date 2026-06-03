import { parseProductVariantsJson } from "../catalog/product-variants.js";
import { prisma } from "../prisma.js";
import {
  resolveVariants,
  unitPriceForVariant,
} from "./server-pricing.js";

export class CheckoutHttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export type ResolvedLine = {
  productSlug: string;
  variantId: string;
  variantLabel: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
};

export type CheckoutItemInput = {
  productSlug: string;
  variantId: string;
  variantLabel: string;
  name: string;
  image?: string;
  quantity: number;
};

export async function resolveCheckoutCart(
  items: CheckoutItemInput[]
): Promise<{ resolvedItems: ResolvedLine[]; total: number }> {
  const slugs = Array.from(new Set(items.map((i) => i.productSlug)));
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      images: true,
      variants: true,
    },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const resolvedItems: ResolvedLine[] = [];

  for (const line of items) {
    const p = bySlug.get(line.productSlug);
    if (!p) {
      throw new CheckoutHttpError(400, `Unknown product: ${line.productSlug}`);
    }
    const pricingSource = {
      price: p.price ?? undefined,
      variants: parseProductVariantsJson(p.variants),
    };
    const variantChoices = resolveVariants(pricingSource);
    const variant = variantChoices.find((x) => x.id === line.variantId);
    if (!variant) {
      const allowed = variantChoices.map((x) => x.id).join(", ");
      throw new CheckoutHttpError(
        400,
        `Invalid variant "${line.variantId}" for ${p.slug}. Allowed: ${allowed}`
      );
    }
    const unit = unitPriceForVariant(pricingSource, line.variantId);
    if (unit == null) {
      throw new CheckoutHttpError(
        400,
        `Product "${p.name}" is price-on-application — remove it or contact concierge.`
      );
    }
    resolvedItems.push({
      productSlug: p.slug,
      variantId: line.variantId,
      variantLabel: variant.label,
      name: p.name,
      image: line.image ?? p.images?.[0] ?? "",
      quantity: line.quantity,
      unitPrice: unit,
    });
  }

  const total = resolvedItems.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return { resolvedItems, total };
}
