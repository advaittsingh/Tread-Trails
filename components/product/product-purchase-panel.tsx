"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { getBrandVisualForProduct } from "@/data/advven-brands";
import type { Product } from "@/data/types";
import { cars } from "@/data/cars";
import { formatInr } from "@/lib/format";
import {
  resolveVariants,
  unitPriceForVariant,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { whatsappProductInterest } from "@/lib/whatsapp";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WhatsAppCta } from "@/components/marketing/cta-buttons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const variants = resolveVariants(product);
  const [variantId, setVariantId] = useState(variants[0].id);
  const [vehicleSlug, setVehicleSlug] = useState("");

  const compatible = useMemo(
    () => cars.filter((c) => product.compatibleCars.includes(c.slug)),
    [product.compatibleCars]
  );

  const price = unitPriceForVariant(product, variantId);
  const priceLabel = formatInr(price ?? undefined);
  const vehicleName =
    compatible.find((c) => c.slug === vehicleSlug)?.name ?? "";

  const bookingHref = useMemo(() => {
    const q = new URLSearchParams();
    q.set("product", product.slug);
    if (vehicleSlug) q.set("vehicle", vehicleSlug);
    q.set(
      "service",
      `Installation — ${product.name}${vehicleName ? ` (${vehicleName})` : ""}`
    );
    return `/booking?${q.toString()}`;
  }, [product.slug, product.name, vehicleSlug, vehicleName]);

  const fitsLabel = compatible.map((c) => c.name).join(", ");
  const brandVis = getBrandVisualForProduct(product);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Badge className="flex items-center gap-2 rounded-full px-3 py-1.5">
          {brandVis.logoSrc ? (
            <Image
              src={brandVis.logoSrc}
              alt=""
              width={20}
              height={20}
              className="size-5 object-contain"
            />
          ) : null}
          <span>{brandVis.label}</span>
        </Badge>
        <Badge variant="secondary" className="rounded-full px-3">
          {product.category}
        </Badge>
        {priceLabel ? (
          <Badge variant="outline" className="rounded-full border-primary/25 px-3">
            {priceLabel}
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-full px-3">
            Price on application
          </Badge>
        )}
      </div>

      <div>
        <h1 className="font-heading text-4xl tracking-tight text-foreground md:text-[2.75rem] md:leading-tight">
          {product.name}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>

      {fitsLabel ? (
        <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3 shadow-card">
          <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            Fits
          </p>
          <p className="mt-1 font-heading text-lg tracking-tight text-foreground">
            {fitsLabel}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="variant">Variant / configuration</Label>
          <select
            id="variant"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
                {v.priceModifier != null && v.priceModifier > 0
                  ? ` (+${formatInr(v.priceModifier) ?? ""})`
                  : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fit-vehicle">Reference vehicle (for concierge)</Label>
          <select
            id="fit-vehicle"
            value={vehicleSlug}
            onChange={(e) => setVehicleSlug(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select platform…</option>
            {compatible.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <AddToCartButton product={product} variantId={variantId} className="h-11 px-6" />
        <Link
          href={bookingHref}
          className={cn(buttonVariants({ variant: "secondary" }), "h-11 px-6")}
        >
          Book installation
        </Link>
        <WhatsAppCta
          message={whatsappProductInterest(product.name, vehicleName || undefined)}
          label="WhatsApp"
          className="h-11 px-6"
          variant="outline"
        />
      </div>

      <Separator />

      <div>
        <h2 className="font-heading text-lg tracking-wide text-foreground uppercase">
          Specifications
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {product.specs.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-card"
            >
              <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">
                {s.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Separator />

      <div>
        <h2 className="font-heading text-lg tracking-wide text-foreground uppercase">
          Compatible vehicles
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {compatible.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/vehicle/${c.slug}`}
                className="inline-flex rounded-full border border-border/80 bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-card transition hover:border-primary/35 hover:text-foreground hover:shadow-card-hover"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
