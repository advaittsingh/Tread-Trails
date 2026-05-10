"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/data/types";
import { cars } from "@/data/cars";
import { formatInr } from "@/lib/format";
import { getBrandVisualForProduct } from "@/data/advven-brands";
import { cn } from "@/lib/utils";

function carLabels(slugs: string[]): string {
  if (slugs.length === 0) return "—";
  const labels = slugs
    .map((s) => cars.find((c) => c.slug === s)?.name ?? s)
    .filter(Boolean);
  return labels.length ? labels.join(", ") : "—";
}

function collectSpecLabels(products: Product[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const p of products) {
    for (const s of p.specs) {
      const key = s.label.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      order.push(key);
    }
  }
  return order;
}

function specCell(product: Product, label: string): string {
  const hit = product.specs.find((s) => s.label.trim() === label);
  return hit?.value?.trim() ? hit.value : "—";
}

export function CompareTable({ products }: { products: Product[] }) {
  const specLabels = collectSpecLabels(products);

  return (
    <>
      <div className="space-y-6 md:hidden">
        {products.map((p) => {
          const brandVis = getBrandVisualForProduct(p);
          const priceLabel = formatInr(p.price);
          return (
            <article
              key={p.slug}
              className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-card"
            >
              <div className="flex gap-4 border-b border-border/60 p-4">
                <Link
                  href={`/product/${p.slug}`}
                  className="relative block size-24 shrink-0 overflow-hidden rounded-lg bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  aria-label={`${p.name}, view product`}
                >
                  {p.images[0] ? (
                    <Image
                      src={p.images[0]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1 space-y-2">
                  <Link
                    href={`/product/${p.slug}`}
                    className="rounded-md font-heading text-lg leading-snug text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    {p.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    {brandVis.logoSrc ? (
                      <Image
                        src={brandVis.logoSrc}
                        alt=""
                        width={18}
                        height={18}
                        className="size-[18px] object-contain"
                        aria-hidden
                      />
                    ) : null}
                    <span className="text-xs text-muted-foreground">{brandVis.label}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {priceLabel ?? "POA"}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
              </div>
              <dl className="divide-y divide-border/60 px-4 py-2 text-sm">
                <div className="flex gap-3 py-2">
                  <dt className="w-[38%] shrink-0 text-muted-foreground">Vehicle fit</dt>
                  <dd className="min-w-0 text-foreground">{carLabels(p.compatibleCars)}</dd>
                </div>
                <div className="flex gap-3 py-2">
                  <dt className="w-[38%] shrink-0 text-muted-foreground">Summary</dt>
                  <dd className="min-w-0 text-foreground">{p.description}</dd>
                </div>
                {specLabels.map((label) => (
                  <div key={`${p.slug}-${label}`} className="flex gap-3 py-2">
                    <dt className="w-[38%] shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 text-foreground">{specCell(p, label)}</dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>

      <div className="hidden md:block md:overflow-x-auto md:rounded-xl md:border md:border-border/70 md:shadow-card">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-muted/30">
              <th
                scope="col"
                className="sticky left-0 z-20 w-40 min-w-[10rem] bg-muted/30 px-4 py-3 text-[11px] font-medium tracking-widest text-muted-foreground uppercase backdrop-blur-sm"
              >
                Attribute
              </th>
              {products.map((p) => (
                <th
                  key={p.slug}
                  scope="col"
                  className="min-w-[180px] border-l border-border/60 px-4 py-3 align-bottom font-normal"
                >
                  <Link
                    href={`/product/${p.slug}`}
                    className="group flex flex-col gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    <span className="relative mx-auto block aspect-square w-full max-w-[140px] overflow-hidden rounded-lg bg-muted/40">
                      {p.images[0] ? (
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="140px"
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span className="font-heading text-base leading-snug text-foreground underline-offset-4 group-hover:underline">
                      {p.name}
                    </span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <TableMetricRow label="Brand" products={products}>
              {(p) => {
                const vis = getBrandVisualForProduct(p);
                return (
                  <span className="flex items-center gap-2">
                    {vis.logoSrc ? (
                      <Image
                        src={vis.logoSrc}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 object-contain"
                      />
                    ) : null}
                    {vis.label}
                  </span>
                );
              }}
            </TableMetricRow>
            <TableMetricRow label="Category" products={products}>
              {(p) => p.category}
            </TableMetricRow>
            <TableMetricRow label="Price" products={products}>
              {(p) => formatInr(p.price) ?? "POA"}
            </TableMetricRow>
            <TableMetricRow label="Vehicle fit" products={products}>
              {(p) => carLabels(p.compatibleCars)}
            </TableMetricRow>
            <TableMetricRow label="Description" products={products}>
              {(p) => (
                <span className="text-muted-foreground">{p.description}</span>
              )}
            </TableMetricRow>
            {specLabels.map((label) => (
              <TableMetricRow key={label} label={label} products={products}>
                {(p) => specCell(p, label)}
              </TableMetricRow>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TableMetricRow({
  label,
  products,
  children,
}: {
  label: string;
  products: Product[];
  children: (product: Product) => ReactNode;
}) {
  return (
    <tr className="bg-card">
      <th
        scope="row"
        className={cn(
          "sticky left-0 z-10 border-r border-border/50 bg-card px-4 py-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase backdrop-blur-sm"
        )}
      >
        {label}
      </th>
      {products.map((p) => (
        <td
          key={p.slug}
          className="border-l border-border/50 px-4 py-3 align-top text-foreground"
        >
          {children(p)}
        </td>
      ))}
    </tr>
  );
}
