import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import {
  getBundleSuggestion,
  getProductBySlug,
  getRelatedProducts,
  products,
} from "@/data/index";
import {
  excerptPlain,
  getBreadcrumbListJsonLd,
  getProductJsonLd,
} from "@/lib/seo/json-ld-builders";
import { absoluteUrl } from "@/lib/site";

import { BundleAddButton } from "@/components/cart/bundle-add-button";
import { ImageGallery } from "@/components/detail/image-gallery";
import { ProductCard } from "@/components/marketing/product-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { JsonLd } from "@/components/seo/json-ld";

const ProductAiRecommendations = dynamic(
  () =>
    import("@/components/product/product-ai-recommendations").then((m) => ({
      default: m.ProductAiRecommendations,
    })),
  {
    loading: () => (
      <div
        className="mt-16 space-y-6 border-t border-border/60 pt-12"
        aria-hidden
      >
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="min-h-[200px] animate-pulse rounded-xl bg-muted" />
      </div>
    ),
  }
);

const ProductPageUx = dynamic(
  () =>
    import("@/components/product/product-page-ux").then((m) => ({
      default: m.ProductPageUx,
    })),
  { loading: () => null }
);

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Product" };
  const canonical = absoluteUrl(`/product/${product.slug}`);
  const desc = excerptPlain(product.description, 165);
  const ogImage = product.images[0];
  const ogImages =
    ogImage != null && ogImage.length > 0
      ? [{ url: ogImage, width: 1200, height: 630, alt: product.name }]
      : [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: product.name }];
  return {
    title: product.name,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${product.name} | Tread Trails`,
      description: desc,
      url: canonical,
      siteName: "Tread Trails",
      locale: "en_IN",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Tread Trails`,
      description: desc,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default function ProductDetailPage({ params }: Props) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const related = getRelatedProducts(product.slug);
  const bundleSuggestion = getBundleSuggestion(product.slug);
  const bundlePack =
    bundleSuggestion.length > 0 ? [product, ...bundleSuggestion] : [];

  const canonical = absoluteUrl(`/product/${product.slug}`);
  const productLd = getProductJsonLd(product, canonical);
  const breadcrumbLd = getBreadcrumbListJsonLd([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Products", item: absoluteUrl("/products") },
    { name: product.name, item: canonical },
  ]);

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
      />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <ImageGallery images={product.images} alt={product.name} />
        <div className="lg:sticky lg:top-28">
          <ProductPurchasePanel product={product} />
        </div>
      </div>

      <ProductAiRecommendations productSlug={product.slug} />

      {bundlePack.length > 1 ? (
        <section className="mt-24 space-y-8 border-t border-border/60 pt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Bundles"
              title="Frequently bought together"
              description="Complete the stack our installers pair most often with this SKU."
              className="mb-0 max-w-xl"
            />
            <BundleAddButton
              items={bundlePack}
              label="Add bundle to cart"
            />
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {bundleSuggestion.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-20 space-y-8 border-t border-border/60 pt-16">
          <SectionHeading
            eyebrow="Catalog"
            title="Related products"
            description="Adjacent programs from the same discipline or brand house."
            className="mb-0 max-w-xl"
          />
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <ProductPageUx currentSlug={product.slug} />
      </div>
    </>
  );
}
