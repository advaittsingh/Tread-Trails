import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  findMakeInTree,
  findModelInMake,
  groupVehiclesByGeneration,
} from "@/lib/catalog/vehicle-hierarchy";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getVehicleExplorerTree } from "@/lib/server/vehicle-catalog";

import { VehicleExplorerShell } from "@/components/vehicles/vehicle-explorer-shell";
import { VehicleGenerationSections } from "@/components/vehicles/vehicle-generation-sections";

type PageProps = {
  params: Promise<{ makeSlug: string; modelSlug: string }>;
};

export async function generateStaticParams() {
  const tree = await getVehicleExplorerTree();
  return tree.flatMap((mk) =>
    mk.models.map((m) => ({
      makeSlug: mk.make.slug,
      modelSlug: m.model.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { makeSlug, modelSlug } = await params;
  const tree = await getVehicleExplorerTree();
  const make = findMakeInTree(tree, makeSlug);
  const model = make ? findModelInMake(make, modelSlug) : undefined;
  if (!make || !model) return {};

  return buildPageMetadata({
    segmentTitle: `${make.make.name} ${model.model.name}`,
    description: `Generations and variants for ${make.make.name} ${model.model.name} — open a platform hub for compatible parts and portfolio builds.`,
    path: `/vehicles/${makeSlug}/${modelSlug}`,
  });
}

export default async function VehicleModelPage({ params }: PageProps) {
  const { makeSlug, modelSlug } = await params;
  const tree = await getVehicleExplorerTree();
  const make = findMakeInTree(tree, makeSlug);
  const model = make ? findModelInMake(make, modelSlug) : undefined;
  if (!make || !model) notFound();

  const groups = groupVehiclesByGeneration(model.vehicles);

  return (
    <VehicleExplorerShell
      breadcrumbs={[
        { label: "Vehicles", href: "/vehicles" },
        { label: make.make.name, href: `/vehicles/${makeSlug}` },
        { label: model.model.name },
      ]}
      eyebrow={`${make.make.name} · ${model.model.name}`}
      title="Generations & variants"
      description="Each row is a fitment platform — year span, trims, and linked catalog for that chassis."
    >
      <VehicleGenerationSections groups={groups} />
    </VehicleExplorerShell>
  );
}
