"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useProductCatalog } from "@/contexts/product-catalog-context";
import type { Product } from "@/data/types";
import { useSelectedVehicle } from "@/contexts/selected-vehicle-context";
import {
  buildRecommendationsPayload,
  type ProductRecommendationsPayload,
} from "@/lib/recommendations/build-payload";

import { AIRecommendationCard } from "@/components/product/ai-recommendation-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

type ApiPayload = ProductRecommendationsPayload & {
  source?: string;
};

export function ProductAiRecommendations({ productSlug }: { productSlug: string }) {
  const { getProductBySlug } = useProductCatalog();
  const { slug: vehicleSlug, vehicleName, hydrated: vehicleHydrated } =
    useSelectedVehicle();

  function resolveEntries(
    entries: { productSlug: string; rationale: string; badge?: string }[]
  ): { product: Product; rationale: string; badge?: string }[] {
    const out: { product: Product; rationale: string; badge?: string }[] = [];
    for (const e of entries) {
      const p = getProductBySlug(e.productSlug);
      if (p) out.push({ product: p, rationale: e.rationale, badge: e.badge });
    }
    return out;
  }
  const [payload, setPayload] = useState<ProductRecommendationsPayload | null>(null);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/products/${encodeURIComponent(productSlug)}/recommendations`,
          { credentials: "same-origin" }
        );
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as ApiPayload;
        if (cancelled) return;
        const { source: remoteSource, ...rest } = data;
        setPayload({
          forVehicle: rest.forVehicle ?? [],
          alsoBought: rest.alsoBought ?? [],
          upgradePath: rest.upgradePath ?? { intro: "", steps: [] },
        });
        setSource(remoteSource === "api" ? "api" : "mock");
      } catch {
        if (cancelled) return;
        setPayload(await buildRecommendationsPayload(productSlug));
        setSource("mock");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  const vehicleFiltered = useMemo(() => {
    if (!payload) return [];
    const resolved = resolveEntries(payload.forVehicle);
    if (!vehicleHydrated || !vehicleSlug) return resolved;
    const filtered = resolved.filter((r) =>
      r.product.compatibleCars.includes(vehicleSlug)
    );
    return filtered.length > 0 ? filtered : resolved;
  }, [payload, vehicleHydrated, vehicleSlug, getProductBySlug]);

  const alsoBoughtResolved = useMemo(
    () => (payload ? resolveEntries(payload.alsoBought) : []),
    [payload, getProductBySlug]
  );

  const upgradeResolved = useMemo(() => {
    if (!payload) return [];
    const steps = payload.upgradePath.steps;
    return steps
      .map((s) => {
        const p = getProductBySlug(s.productSlug);
        return p
          ? {
              product: p,
              rationale: s.rationale,
              badge: s.badge,
              step: s.step,
            }
          : null;
      })
      .filter(Boolean) as {
      product: Product;
      rationale: string;
      badge?: string;
      step: number;
    }[];
  }, [payload, getProductBySlug]);

  if (loading || !payload) {
    return (
      <section className="mt-20 space-y-10 border-t border-border/60 pt-16">
        <Skeleton className="h-28 max-w-xl rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </section>
    );
  }

  const showVehicleSection = vehicleFiltered.length > 0;
  const showAlso = alsoBoughtResolved.length > 0;
  const showPath = upgradeResolved.length > 0;

  if (!showVehicleSection && !showAlso && !showPath) return null;

  return (
    <section className="mt-20 space-y-16 border-t border-border/60 pt-16">
      <p className="text-xs text-muted-foreground">
        {source === "mock" ? (
          <>
            Showing curated guidance while the recommendations service warms up —{" "}
            <Link href="/booking" className="text-primary underline-offset-4 hover:underline">
              ask the studio
            </Link>{" "}
            for a bespoke stack.
          </>
        ) : (
          "Guidance tuned from catalog fitment, bundles, and studio attachment patterns."
        )}
      </p>

      {showVehicleSection ? (
        <div className="space-y-6">
          <SectionHeading
            eyebrow="AI picks"
            title="Recommended for Your Vehicle"
            description={
              vehicleHydrated && vehicleSlug && vehicleName
                ? `Prioritizing SKUs that list ${vehicleName} — adjust your platform above anytime.`
                : "These share mapped platforms with this product. Choose a chassis in the purchase panel for sharper filtering."
            }
            className="mb-0 max-w-2xl"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {vehicleFiltered.map(({ product, rationale, badge }) => (
              <AIRecommendationCard
                key={product.slug}
                product={product}
                rationale={rationale}
                badge={badge}
              />
            ))}
          </div>
        </div>
      ) : null}

      {showAlso ? (
        <div className="space-y-6">
          <SectionHeading
            eyebrow="AI picks"
            title="Customers Also Bought"
            description="Pairs we see in carts and installation briefs — not a guarantee of compatibility without verifying your build sheet."
            className="mb-0 max-w-2xl"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {alsoBoughtResolved.map(({ product, rationale, badge }) => (
              <AIRecommendationCard
                key={product.slug}
                product={product}
                rationale={rationale}
                badge={badge}
              />
            ))}
          </div>
        </div>
      ) : null}

      {showPath ? (
        <div className="space-y-6">
          <SectionHeading
            eyebrow="AI picks"
            title="Best Upgrade Path"
            description={payload.upgradePath.intro}
            className="mb-0 max-w-2xl"
          />
          <div className="flex flex-col gap-4">
            {upgradeResolved.map(({ product, rationale, badge, step }) => (
              <AIRecommendationCard
                key={product.slug}
                product={product}
                rationale={rationale}
                badge={badge}
                step={step}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
