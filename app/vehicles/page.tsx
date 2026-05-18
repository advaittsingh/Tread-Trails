import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getVehicleExplorerTree } from "@/lib/server/vehicle-catalog";

import { VehicleExplorerShell } from "@/components/vehicles/vehicle-explorer-shell";
import { VehicleMakeGrid } from "@/components/vehicles/vehicle-make-grid";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Vehicles",
  description:
    "Browse India-market expedition platforms by OEM — Toyota, Mahindra, Maruti Suzuki, Jeep, Mitsubishi, Ford, Isuzu, and Force. Pick a brand, model, generation, then variant.",
  path: "/vehicles",
});

export default async function VehiclesPage() {
  const tree = await getVehicleExplorerTree();

  return (
    <VehicleExplorerShell
      breadcrumbs={[{ label: "Vehicles" }]}
      eyebrow="Fleet intelligence"
      title="Explore by brand"
      description="India-market SUVs, pickups, and 4×4 nameplates — choose a brand, then model line, generation, and variant to open that platform hub."
    >
      <VehicleMakeGrid makes={tree} />
    </VehicleExplorerShell>
  );
}
