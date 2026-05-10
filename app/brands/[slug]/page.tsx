import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductsForBrandSlug } from "@/data/index";
import { excerptPlain } from "@/lib/seo/json-ld-builders";
import {
  absoluteOgAsset,
  defaultOgImage,
} from "@/lib/seo/page-metadata";
import { absoluteUrl } from "@/lib/site";
import { getBrandBySlug, listBrandSlugs } from "@/lib/server/brand-catalog";

import { ProductCard } from "@/components/marketing/product-card";
import { SectionHeading } from "@/components/marketing/section-heading";

type Props = { params: { slug: string } };

export async function generateStaticParams() {
  const slugs = await listBrandSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = await getBrandBySlug(params.slug);
  if (!entry) return { title: "Brand" };
  const title = `${entry.name} parts`;
  const rawDesc =
    entry.tagline ??
    `Shop ${entry.name} upgrades — expedition lighting, armor, suspension, and recovery from Tread Trails.`;
  const description = excerptPlain(rawDesc, 165);
  const canonical = absoluteUrl(`/brands/${entry.slug}`);
  const logoUrl = absoluteOgAsset(entry.logoSrc);
  const ogImages = logoUrl
    ? [{ url: logoUrl, width: 1200, height: 630, alt: entry.name }]
    : [defaultOgImage(entry.name)];
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

export default async function BrandProductsPage({ params }: Props) {
  const entry = await getBrandBySlug(params.slug);
  if (!entry) notFound();

  const brandProducts = getProductsForBrandSlug(params.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <nav className="mb-10 text-sm text-muted-foreground">
        <Link href="/brands" className="transition hover:text-primary">
          Brands
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">{entry.name}</span>
      </nav>

      <div className="mb-14 flex max-w-3xl flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
        {entry.logoSrc ? (
          <div className="flex shrink-0 justify-center sm:justify-start">
            <Image
              src={entry.logoSrc}
              alt={`${entry.name} logo`}
              width={220}
              height={88}
              className="h-20 w-auto max-w-[200px] object-contain sm:h-24"
            />
          </div>
        ) : null}
        <SectionHeading
          titleAs="h1"
          eyebrow="Catalog"
          title={`${entry.name} — shop the line`}
          description={
            entry.tagline ??
            "Compatible SKUs ship with explicit vehicle matrices — configure variants on each product page before checkout."
          }
          className="max-w-none flex-1"
        />
      </div>

      {brandProducts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-16 text-center text-sm text-muted-foreground">
          No live listings for this brand yet.
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {brandProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
