import { NextResponse } from "next/server";

import {
  resolveVariants,
  unitPriceForVariant,
} from "@/lib/order/server-pricing";
import { prisma } from "@/lib/prisma";
import { parseProductVariantsJson } from "@/lib/catalog/product-variants";

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

/**
 * Loads catalogue pricing server-side for checkout — shared by Stripe / Razorpay / Juspay / COD.
 */
export async function resolveCheckoutCart(items: CheckoutItemInput[]): Promise<
  NextResponse | { resolvedItems: ResolvedLine[]; total: number }
> {
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
      return NextResponse.json(
        { error: `Unknown product: ${line.productSlug}` },
        { status: 400 }
      );
    }
    const pricingSource = {
      price: p.price ?? undefined,
      variants: parseProductVariantsJson(p.variants),
    };
    const variantChoices = resolveVariants(pricingSource);
    const variant = variantChoices.find((x) => x.id === line.variantId);
    if (!variant) {
      const allowed = variantChoices.map((x) => x.id).join(", ");
      return NextResponse.json(
        {
          error: `Invalid variant "${line.variantId}" for ${p.slug}. Allowed: ${allowed}`,
        },
        { status: 400 }
      );
    }
    const unit = unitPriceForVariant(pricingSource, line.variantId);
    if (unit == null) {
      return NextResponse.json(
        {
          error: `Product "${p.name}" is price-on-application — remove it or contact concierge.`,
        },
        { status: 400 }
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
