import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Checkout",
  alternates: { canonical: absoluteUrl("/checkout") },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        align="center"
        eyebrow="Secure checkout"
        title="Complete your order"
        description="Stripe Checkout for card/UPI rails, COD stays pending for manual confirmation — totals reconciled against MongoDB catalog prices."
        className="mx-auto mb-14 max-w-2xl"
      />
      <CheckoutFlow />
    </div>
  );
}
