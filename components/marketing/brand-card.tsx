"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { BrandEntry } from "@/data/index";

import { cardShellClass } from "@/lib/card-surfaces";
import { cn } from "@/lib/utils";

type BrandCardProps = {
  brand: BrandEntry;
  index?: number;
  /** Narrow card for homepage carousel strips. */
  variant?: "default" | "compact";
  /** Cream surfaces for textured homepage sections. */
  onTextureBg?: boolean;
  className?: string;
};

export const BrandCard = memo(function BrandCard({
  brand,
  index = 0,
  variant = "default",
  onTextureBg = false,
  className,
}: BrandCardProps) {
  const reduceMotion = useReducedMotion();
  const compact = variant === "compact";
  const cta = `Explore ${brand.name}`;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reduceMotion ? 0 : 0.45,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: compact ? -4 : -5 }}
      className={cn("group relative min-w-0", className)}
    >
      <Link
        href={`/brands/${brand.slug}`}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${brand.name} — partner brand hub with filtered catalog`}
      >
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden rounded-xl transition-shadow duration-300 hover:shadow-card-hover",
            cardShellClass(onTextureBg),
            compact
              ? "min-h-[220px] rounded-lg p-4 shadow-sm hover:shadow-card"
              : "min-h-[280px] p-6"
          )}
        >
          <div
            className={cn(
              "relative flex flex-1 items-center justify-center",
              compact ? "min-h-[72px] py-2" : "min-h-[100px] py-4"
            )}
          >
            {brand.logoSrc ? (
              <Image
                src={brand.logoSrc}
                alt={`${brand.name} logo`}
                width={200}
                height={72}
                className={cn(
                  "w-auto max-w-[85%] object-contain",
                  compact ? "max-h-[52px]" : "max-h-[72px]"
                )}
              />
            ) : (
              <span
                className={cn(
                  "font-heading tracking-tight text-foreground",
                  compact ? "text-lg" : "text-2xl"
                )}
              >
                {brand.name}
              </span>
            )}
          </div>
          <div
            className={cn(
              "mt-auto space-y-3 border-t pt-5 text-center",
              onTextureBg ? "border-primary/15" : "border-border/50",
              compact && "space-y-2 pt-3.5"
            )}
          >
            <h3
              className={cn(
                "font-heading tracking-tight",
                compact ? "text-base sm:text-lg" : "text-xl"
              )}
            >
              {brand.name}
            </h3>
            {brand.tagline ? (
              <p
                className={cn(
                  "leading-relaxed text-muted-foreground",
                  compact
                    ? "line-clamp-2 text-xs leading-snug"
                    : "text-sm"
                )}
              >
                {brand.tagline}
              </p>
            ) : (
              <p
                className={cn(
                  "text-muted-foreground",
                  compact ? "text-xs" : "text-sm"
                )}
              >
                {brand.productCount}{" "}
                {brand.productCount === 1 ? "product" : "products"} in catalog
              </p>
            )}
            <span
              className={cn(
                "inline-flex items-center justify-center gap-1 font-medium text-primary",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {cta}
              <ArrowUpRight
                className={cn(
                  "transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                  compact ? "size-3.5" : "size-4"
                )}
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
});
