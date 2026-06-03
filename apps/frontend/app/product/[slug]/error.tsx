"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function ProductDetailError({
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
      title="Couldn't load this product"
      links={[
        { href: "/products", label: "Browse products" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
