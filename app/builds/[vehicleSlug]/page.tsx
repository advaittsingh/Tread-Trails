import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { excerptPlain } from "@/lib/seo/json-ld-builders";
import {
  absoluteOgAsset,
  defaultOgImage,
} from "@/lib/seo/page-metadata";
import { absoluteUrl } from "@/lib/site";
import { getBuildsForVehicle } from "@/lib/server/build-catalog";
import {
  getVehicleBySlug,
  listVehicleSlugs,
} from "@/lib/server/vehicle-catalog";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { BuildCard } from "@/components/marketing/build-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { PrimaryCta } from "@/components/marketing/cta-buttons";

type Props = { params: { vehicleSlug: string } };

export async function generateStaticParams() {
  const slugs = await listVehicleSlugs();
  return slugs.map((vehicleSlug) => ({ vehicleSlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await getVehicleBySlug(params.vehicleSlug);
  if (!car) return { title: "Builds" };
  const title = `${car.name} builds`;
  const rawDesc = `Portfolio builds engineered on the ${car.name} platform — before/after installs and parts manifests from Tread Trails.`;
  const description = excerptPlain(rawDesc, 165);
  const canonical = absoluteUrl(`/builds/${car.slug}`);
  const heroUrl = absoluteOgAsset(car.heroImage);
  const ogImages = heroUrl
    ? [{ url: heroUrl, width: 1200, height: 630, alt: car.name }]
    : [defaultOgImage(title)];
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | Tread Trails`,
      description,
      url: canonical,
      siteName: "Tread Trails",
      locale: "en_IN",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Tread Trails`,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default async function BuildsForVehiclePage({ params }: Props) {
  const car = await getVehicleBySlug(params.vehicleSlug);
  if (!car) notFound();

  const vehicleBuilds = await getBuildsForVehicle(car.slug);

  return (
    <MarketingPageShell background="terrain">
      <nav className="mb-10 text-sm text-muted-foreground">
        <Link href="/builds" className="transition hover:text-primary">
          Builds
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">{car.name}</span>
      </nav>

      <SectionHeading
        titleAs="h1"
        eyebrow="Portfolio"
        title={`${car.name} builds`}
        description="Open a case study for install narrative and parts traceability — or jump straight into the platform catalog for everything we retail for this chassis."
        className="mb-10 max-w-3xl"
      />

      <div className="mb-12 flex flex-wrap gap-3">
        <PrimaryCta href={`/vehicle/${car.slug}`} className="h-11 px-6 shadow-card">
          Shop parts for {car.name}
        </PrimaryCta>
        <Link
          href="/builds"
          className="inline-flex h-11 items-center rounded-xl border border-border/80 bg-background px-6 text-sm tracking-wide text-muted-foreground shadow-card transition hover:border-primary/35 hover:text-foreground"
        >
          All platforms
        </Link>
      </div>

      {vehicleBuilds.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-16 text-center text-sm text-muted-foreground">
          Builds for {car.name} are coming online soon.{" "}
          <Link href={`/vehicle/${car.slug}`} className="text-primary underline-offset-4 hover:underline">
            Browse compatible parts
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-12 md:grid-cols-2">
          {vehicleBuilds.map((b, i) => (
            <BuildCard key={b.id} build={b} vehicleName={car.name} index={i} />
          ))}
        </div>
      )}
    </MarketingPageShell>
  );
}
