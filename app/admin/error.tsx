"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function AdminRouteError({
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
      variant="admin"
      title="Admin panel error"
      links={[{ href: "/admin", label: "Admin home" }]}
    />
  );
}
