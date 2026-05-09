import type { Metadata } from "next";
import { Suspense } from "react";

import { absoluteUrl } from "@/lib/site";

import { CheckoutSuccess } from "@/components/checkout/checkout-success";

export const metadata: Metadata = {
  title: "Payment success",
  alternates: { canonical: absoluteUrl("/checkout/success") },
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        }
      >
        <CheckoutSuccess />
      </Suspense>
    </div>
  );
}
