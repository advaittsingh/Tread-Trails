import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { CheckoutSuccess } from "@/components/checkout/checkout-success";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Payment success",
  description:
    "Payment confirmation for your Tread Trails order — keep this page or your email receipt while we reconcile payment and dispatch.",
  path: "/checkout/success",
  robots: { index: false, follow: true },
});

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
