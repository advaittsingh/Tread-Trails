import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findMakeInTree } from "@/lib/catalog/vehicle-hierarchy";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getVehicleExplorerTree } from "@/lib/server/vehicle-catalog";

import { VehicleExplorerShell } from "@/components/vehicles/vehicle-explorer-shell";
import { VehicleModelGrid } from "@/components/vehicles/vehicle-model-grid";

type PageProps = {
  params: Promise<{ makeSlug: string }>;
};

export async function generateStaticParams() {
  const tree = await getVehicleExplorerTree();
  return tree.map((n) => ({ makeSlug: n.make.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { makeSlug } = await params;
  const tree = await getVehicleExplorerTree();
  const make = findMakeInTree(tree, makeSlug);
  if (!make) return {};

  return buildPageMetadata({
    segmentTitle: `${make.make.name} vehicles`,
    description: `Model lines and generations for ${make.make.name} — expedition platforms, compatible catalog, and studio fitting at Tread Trails.`,
    path: `/vehicles/${makeSlug}`,
  });
}

export default async function VehicleMakePage({ params }: PageProps) {
  const { makeSlug } = await params;
  const tree = await getVehicleExplorerTree();
  const make = findMakeInTree(tree, makeSlug);
  if (!make) notFound();

  return (
    <VehicleExplorerShell
      breadcrumbs={[
        { label: "Vehicles", href: "/vehicles" },
        { label: make.make.name },
      ]}
      eyebrow={make.make.name}
      title="Model lines"
      description={`Select a ${make.make.name} model to browse generations, year spans, and every variant we support.`}
    >
      <VehicleModelGrid makeSlug={make.make.slug} models={make.models} />
    </VehicleExplorerShell>
  );
}
