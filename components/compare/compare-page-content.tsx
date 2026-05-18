"use client";

import Link from "next/link";

import type { Product } from "@/data/types";
import { useProductCatalog } from "@/contexts/product-catalog-context";
import { useConfirmation } from "@/contexts/confirmation-context";
import { useCompare } from "@/contexts/compare-context";
import { toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { CompareTable } from "@/components/compare/compare-table";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button, buttonVariants } from "@/components/ui/button";

export function ComparePageContent() {
  const { getProductBySlug } = useProductCatalog();
  const { confirmAction } = useConfirmation();
  const { slugs, hydrated, clear, remove } = useCompare();

  async function confirmClearAll() {
    const ok = await confirmAction({
      title: "Clear entire compare list?",
      description: "All compared products will be removed from this device.",
      confirmLabel: "Clear all",
    });
    if (ok) {
      clear();
      toastSuccess("Compare list cleared");
    }
  }

  const pairs = slugs.map((slug) => ({ slug, product: getProductBySlug(slug) }));
  const resolved = pairs.filter(
    (x): x is { slug: string; product: Product } => Boolean(x.product)
  );
  const missing = pairs.filter((x) => !x.product).map((x) => x.slug);

  if (!hydrated) {
    return (
      <>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" aria-hidden />
        <div className="mt-10 space-y-4">
          <div className="h-40 animate-pulse rounded-xl bg-muted" aria-hidden />
        </div>
      </>
    );
  }

  if (slugs.length === 0) {
    return (
      <>
        <SectionHeading
          titleAs="h1"
          eyebrow="Compare"
          title="No products selected"
          description="Add up to four accessories from product cards or a product page, then open this table to contrast specs side by side."
          className="max-w-2xl"
        />
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: "default" }), "mt-10 inline-flex")}
        >
          Browse products
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          titleAs="h1"
          eyebrow="Compare"
          title="Product comparison"
          description="Review specs, pricing, and vehicle fitment across your shortlist. Remove items here or from the tray — your selection stays in this browser."
          className="mb-0 max-w-2xl"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void confirmClearAll()}
          >
            Clear all
          </Button>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "inline-flex")}
          >
            Add more
          </Link>
        </div>
      </div>

      {missing.length > 0 ? (
        <p className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Some saved items are no longer in the catalog and were skipped:{" "}
          <span className="font-mono text-xs">{missing.join(", ")}</span>
        </p>
      ) : null}

      <div className="mt-10 space-y-8">
        {resolved.length > 0 ? (
          <>
            <CompareTable products={resolved.map((r) => r.product)} />
            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-8">
              {resolved.map((r) => (
                <Button
                  key={r.slug}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="max-w-full truncate"
                  onClick={() => remove(r.slug)}
                >
                  Remove {r.product.name}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-border/70 bg-muted/30 px-6 py-10 text-center">
            <p className="text-muted-foreground">
              None of the saved slugs match the current catalog. Clear the list and add products again.
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={() => void confirmClearAll()}
            >
              Clear compare list
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
