"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { Product } from "@/data/types";
import { formatInr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

export function AIRecommendationCard({
  product,
  rationale,
  badge,
  step,
  className,
}: {
  product: Product;
  rationale: string;
  badge?: string;
  step?: number;
  className?: string;
}) {
  const price = formatInr(product.price);

  return (
    <article
      className={cn(
        "group flex gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-card transition hover:border-primary/25 hover:shadow-card-hover",
        className
      )}
    >
      {step != null ? (
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-heading text-sm text-primary"
          aria-hidden
        >
          {step}
        </div>
      ) : null}
      <Link
        href={`/product/${product.slug}`}
        className="relative block size-20 shrink-0 overflow-hidden rounded-lg bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View ${product.name}`}
      >
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes="80px"
            className="object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
            —
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-primary/25 bg-primary/5 text-[10px] tracking-wide text-primary uppercase"
          >
            <Sparkles className="mr-1 size-3" aria-hidden />
            AI guide
          </Badge>
          {badge ? (
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {badge}
            </Badge>
          ) : null}
        </div>
        <Link
          href={`/product/${product.slug}`}
          className="block font-heading text-base leading-snug text-foreground underline-offset-4 hover:underline"
        >
          {product.name}
        </Link>
        <p className="text-sm leading-relaxed text-muted-foreground">{rationale}</p>
        <p className="text-xs font-medium tabular-nums text-foreground">
          {price ?? "POA"}
        </p>
      </div>
    </article>
  );
}
