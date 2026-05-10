"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function AccountError({
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
      title="Account couldn't load"
      links={[
        { href: "/login", label: "Sign in" },
        { href: "/", label: "Home" },
      ]}
    />
  );
}
