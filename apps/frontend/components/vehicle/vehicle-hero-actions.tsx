"use client";

import { SaveVehicleToggle } from "@/components/vehicle/save-vehicle-toggle";

export function VehicleHeroActions({
  vehicleSlug,
  vehicleName,
}: {
  vehicleSlug: string;
  vehicleName: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 pb-1">
      <SaveVehicleToggle vehicleSlug={vehicleSlug} vehicleName={vehicleName} />
    </div>
  );
}
