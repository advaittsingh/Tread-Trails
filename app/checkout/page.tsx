import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Checkout",
  description:
    "Secure checkout — pay with Stripe, Razorpay, or Juspay, or choose cash on delivery. Enter shipping details; your order is recorded for fulfilment.",
  path: "/checkout",
  robots: { index: false, follow: true },
});

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow="Secure checkout"
        title="Complete your order"
        description="Stripe Checkout for card/UPI rails, COD stays pending for manual confirmation — totals reconciled against Neon (Postgres) catalog prices."
        className="mx-auto mb-14 max-w-2xl"
      />
      <CheckoutFlow />
    </div>
  );
}
