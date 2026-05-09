import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

import { CartPageContent } from "@/components/cart/cart-page-content";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Cart",
  alternates: { canonical: absoluteUrl("/cart") },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Checkout"
        title="Your cart"
        description="Review quantities before proceeding — totals respect studio quoting rules for POA items."
        className="mb-12 max-w-xl"
      />
      <CartPageContent />
    </div>
  );
}
