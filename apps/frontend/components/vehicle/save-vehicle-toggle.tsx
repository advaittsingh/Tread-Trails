"use client";

import { Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSavedVehicles } from "@/contexts/saved-vehicles-context";

import { Button } from "@/components/ui/button";

export function SaveVehicleToggle({
  vehicleSlug,
  vehicleName,
}: {
  vehicleSlug: string;
  vehicleName: string;
}) {
  const { has, toggle } = useSavedVehicles();
  const saved = has(vehicleSlug);

  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-2 border-border/80 shadow-none transition hover:shadow-card",
        saved && "shadow-card"
      )}
      aria-pressed={saved}
      aria-label={
        saved ? `Remove ${vehicleName} from saved garage` : `Save ${vehicleName} to garage`
      }
      onClick={() => toggle(vehicleSlug)}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
      {saved ? "Saved" : "Save vehicle"}
    </Button>
  );
}
