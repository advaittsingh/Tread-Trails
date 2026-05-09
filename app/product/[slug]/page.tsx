import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getBundleSuggestion,
  getProductBySlug,
  getRelatedProducts,
  products,
} from "@/data/index";
import { absoluteUrl } from "@/lib/site";

import { BundleAddButton } from "@/components/cart/bundle-add-button";
import { ImageGallery } from "@/components/detail/image-gallery";
import { ProductCard } from "@/components/marketing/product-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: absoluteUrl(`/product/${product.slug}`) },
    openGraph: {
      title: product.name,
      description: product.description,
      url: absoluteUrl(`/product/${product.slug}`),
      type: "website",
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <ImageGallery images={product.images} alt={product.name} />
        <div className="lg:sticky lg:top-28">
          <ProductPurchasePanel product={product} />
        </div>
      </div>

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
    </div>
  );
}
