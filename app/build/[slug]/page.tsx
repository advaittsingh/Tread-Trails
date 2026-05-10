import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductsByIds } from "@/data/index";
import {
  getBuildBySlug,
  listBuildSlugs,
} from "@/lib/server/build-catalog";
import { getVehicleBySlug } from "@/lib/server/vehicle-catalog";
import {
  excerptPlain,
  getBreadcrumbListJsonLd,
} from "@/lib/seo/json-ld-builders";
import { absoluteUrl } from "@/lib/site";
import { whatsappBuildInterest } from "@/lib/whatsapp";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/layout/breadcrumbs";
import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";
import { ProductCard } from "@/components/marketing/product-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { JsonLd } from "@/components/seo/json-ld";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  const slugs = await listBuildSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const build = await getBuildBySlug(params.slug);
  if (!build) return { title: "Build" };
  const canonical = absoluteUrl(`/build/${build.slug}`);
  const desc = excerptPlain(build.summary, 165);
  const ogImage = build.afterImage || build.beforeImage;
  const ogImages = [
    {
      url: ogImage,
      width: 1200,
      height: 630,
      alt: build.title,
    },
  ];
  return {
    title: build.title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${build.title} | Tread Trails`,
      description: desc,
      url: canonical,
      siteName: "Tread Trails",
      locale: "en_IN",
      type: "article",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${build.title} | Tread Trails`,
      description: desc,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default async function BuildDetailPage({ params }: Props) {
  const build = await getBuildBySlug(params.slug);
  if (!build) notFound();

  const vehicle = await getVehicleBySlug(build.vehicleSlug);
  const parts = getProductsByIds(build.productIds);

  const bookingParams = new URLSearchParams();
  bookingParams.set("build", build.slug);
  if (vehicle) bookingParams.set("vehicle", vehicle.slug);
  bookingParams.set(
    "service",
    `Replicate build — ${build.title}${vehicle ? ` (${vehicle.name})` : ""}`
  );
  const bookingHref = `/booking?${bookingParams.toString()}`;

  const crumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Builds", href: "/builds" },
  ];
  if (vehicle) {
    crumbItems.push({ label: vehicle.name, href: `/builds/${vehicle.slug}` });
  }
  crumbItems.push({ label: build.title });

  const buildUrl = absoluteUrl(`/build/${build.slug}`);
  const breadcrumbLd = getBreadcrumbListJsonLd([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Builds", item: absoluteUrl("/builds") },
    ...(vehicle
      ? [{ name: vehicle.name, item: absoluteUrl(`/builds/${vehicle.slug}`) }]
      : []),
    { name: build.title, item: buildUrl },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbLd} />
    <article className="pb-24">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Breadcrumbs className="mb-8" items={crumbItems} />
          <div className="flex flex-wrap gap-2">
            {vehicle ? (
              <Badge variant="secondary" className="rounded-full">
                {vehicle.name}
              </Badge>
            ) : null}
            <Badge variant="outline" className="rounded-full border-primary/30">
              Portfolio feature
            </Badge>
          </div>
          <h1 className="mt-6 max-w-4xl font-heading text-4xl tracking-tight md:text-6xl">
            {build.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground">{build.summary}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {vehicle ? (
              <Link
                href={`/vehicle/${vehicle.slug}`}
                className="text-sm tracking-wide text-primary underline-offset-4 hover:underline"
              >
                View {vehicle.name} — parts & specs
              </Link>
            ) : null}
            <WhatsAppCta
              message={whatsappBuildInterest(build.title)}
              label="Discuss on WhatsApp"
              className="h-11 px-6 shadow-card"
              variant="outline"
            />
            <PrimaryCta href={bookingHref} className="h-11 px-6 shadow-card">
              Build this for my car
            </PrimaryCta>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-px bg-border/60 px-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-12">
        <div className="relative aspect-[5/4] overflow-hidden bg-muted lg:rounded-tl-2xl">
          <Image
            src={build.beforeImage}
            alt={`${build.title} before`}
            fill
            className="object-cover grayscale"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-[10px] tracking-widest uppercase backdrop-blur">
            Before
          </span>
        </div>
        <div className="relative aspect-[5/4] overflow-hidden bg-muted lg:rounded-tr-2xl">
          <Image
            src={build.afterImage}
            alt={`${build.title} after`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] tracking-widest text-primary-foreground uppercase">
            After
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-12 px-4 pt-16 sm:px-6 lg:px-8">
        <section className="max-w-3xl space-y-4">
          <h2 className="font-heading text-xl tracking-wide uppercase">
            Narrative
          </h2>
          <p className="leading-relaxed text-muted-foreground">{build.description}</p>
        </section>

        <Separator />

        <section>
          <h2 className="font-heading text-xl tracking-wide uppercase">Gallery</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {build.gallery.map((src, i) => (
              <div
                key={src}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-card ring-1 ring-border/60"
              >
                <Image
                  src={src}
                  alt={`${build.title} detail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="font-heading text-xl tracking-wide uppercase">
            Parts used in this build
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tap through to configure variants — bundling discounts wire server-side later.
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {parts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      </div>
    </article>
    </>
  );
}
