"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { BrandEntry } from "@/data/index";

type BrandCardProps = {
  brand: BrandEntry;
  index?: number;
};

export const BrandCard = memo(function BrandCard({
  brand,
  index = 0,
}: BrandCardProps) {
  const reduceMotion = useReducedMotion();
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
      whileHover={reduceMotion ? undefined : { y: -5 }}
      className="group relative"
    >
      <Link
        href={`/brands/${brand.slug}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${brand.name} — partner brand hub with filtered catalog`}
      >
        <div className="flex h-full min-h-[280px] flex-col rounded-xl border border-border/70 bg-card p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
          <div className="relative flex min-h-[100px] flex-1 items-center justify-center py-4">
            {brand.logoSrc ? (
              <Image
                src={brand.logoSrc}
                alt={`${brand.name} logo`}
                width={200}
                height={72}
                className="max-h-[72px] w-auto max-w-[85%] object-contain"
              />
            ) : (
              <span className="font-heading text-2xl tracking-tight text-foreground">
                {brand.name}
              </span>
            )}
          </div>
          <div className="mt-auto space-y-3 border-t border-border/50 pt-5 text-center">
            <h3 className="font-heading text-xl tracking-tight">{brand.name}</h3>
            {brand.tagline ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {brand.tagline}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {brand.productCount}{" "}
                {brand.productCount === 1 ? "product" : "products"} in catalog
              </p>
            )}
            <span className="inline-flex items-center justify-center gap-1 text-sm font-medium text-primary">
              {cta}
              <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
});
