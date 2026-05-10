"use client";

import Link from "next/link";

import { useSelectedVehicle } from "@/contexts/selected-vehicle-context";

import { Button } from "@/components/ui/button";

/**
 * Fixed strip under the navbar when a global chassis context is stored (localStorage).
 */
export function SelectedVehicleBanner() {
  const { slug, vehicleName, clearSelectedVehicle, hydrated } =
    useSelectedVehicle();

  if (!hydrated || !slug || !vehicleName) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-16 z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border/60 bg-muted/50 px-4 py-2 text-xs backdrop-blur-md sm:text-sm"
    >
      <span className="text-muted-foreground">Your platform</span>
      <Link
        href={`/vehicle/${slug}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {vehicleName}
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="h-7 text-muted-foreground hover:text-foreground"
        onClick={() => clearSelectedVehicle()}
      >
        Clear
      </Button>
    </div>
  );
}
