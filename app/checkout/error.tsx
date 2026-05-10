"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Checkout hit a snag"
      links={[
        { href: "/cart", label: "View cart" },
        { href: "/products", label: "Continue shopping" },
      ]}
    />
  );
}
