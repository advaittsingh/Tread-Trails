import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { CartPageContent } from "@/components/cart/cart-page-content";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Cart",
  description:
    "Review cart lines and price-on-application SKUs before checkout — totals reflect live catalog pricing when you proceed to pay.",
  path: "/cart",
  robots: { index: false, follow: true },
});

export default function CartPage() {
  return (
    <MarketingPageShell>
      <SectionHeading
        titleAs="h1"
        eyebrow="Checkout"
        title="Your cart"
        description="Review quantities before proceeding — totals respect studio quoting rules for POA items."
        className="mb-12 max-w-xl"
      />
      <CartPageContent />
    </MarketingPageShell>
  );
}
