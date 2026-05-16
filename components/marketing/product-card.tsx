"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { getBrandVisualForProduct } from "@/data/advven-brands";
import type { Product } from "@/data/types";
import { formatInr } from "@/lib/format";
import { whatsappHref, whatsappProductInterest } from "@/lib/whatsapp";

import { cn } from "@/lib/utils";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { VehicleCompatibilityTags } from "@/components/product/vehicle-compatibility-tags";
import { CompareToggle } from "@/components/compare/compare-toggle";
import { WishlistToggle } from "@/components/wishlist/wishlist-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

type ProductCardProps = {
  product: Product;
  index?: number;
  /** Larger brand logo and price overlay (e.g. homepage featured row). */
  emphasizeOverlay?: boolean;
};

export const ProductCard = memo(function ProductCard({
  product,
  index = 0,
  emphasizeOverlay = false,
}: ProductCardProps) {
  const reduceMotion = useReducedMotion();
  const priceLabel = formatInr(product.price);
  const brandVis = getBrandVisualForProduct(product);

  const brandStrip = (
    <Badge
      className={cn(
        "grid w-full grid-cols-2 overflow-hidden rounded-full border border-border/60 bg-background p-0 tracking-normal shadow-none",
        emphasizeOverlay ? "min-h-14" : "min-h-11"
      )}
    >
      <div className="flex min-w-0 items-center justify-center border-r border-border/50 px-2 py-2">
        {brandVis.logoSrc ? (
          <Image
            src={brandVis.logoSrc}
            alt=""
            width={120}
            height={48}
            className={cn(
              "h-full max-h-full w-full max-w-full object-contain object-center",
              emphasizeOverlay ? "max-h-11" : "max-h-8"
            )}
          />
        ) : (
          <span
            className={cn(
              "font-heading font-medium text-black",
              emphasizeOverlay ? "text-xl" : "text-base"
            )}
          >
            {brandVis.label.charAt(0)}
          </span>
        )}
      </div>
      <div className="flex min-w-0 items-center justify-center px-2 py-2">
        <span
          className={cn(
            "line-clamp-2 text-center font-medium leading-tight text-black",
            emphasizeOverlay ? "text-sm" : "text-xs"
          )}
        >
          {brandVis.label}
        </span>
      </div>
    </Badge>
  );

  const metaLabelClass =
    "text-[10px] font-medium tracking-widest text-muted-foreground uppercase";

  const priceBadge = priceLabel ? (
    <Badge
      variant="secondary"
      className={cn(
        "w-fit rounded-full shadow-none",
        emphasizeOverlay ? "px-3 py-1.5 text-sm font-semibold" : "text-xs font-medium"
      )}
    >
      {priceLabel}
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className={cn(
        "w-fit rounded-full border-border/80 shadow-none",
        emphasizeOverlay ? "px-3 py-1.5 text-sm font-semibold" : "text-xs font-medium"
      )}
    >
      POA
    </Badge>
  );

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }
      }
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card transition-shadow duration-300 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-0 block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.images[0] ?? ""}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>
      </div>
      <div className="relative z-[2] flex flex-1 flex-col gap-4 bg-card px-5 pt-4 pb-5">
        <div className="flex items-center justify-end gap-2">
          <WishlistToggle productSlug={product.slug} label={product.name} className="shadow-none" />
          <CompareToggle productSlug={product.slug} label={product.name} className="shadow-none" />
        </div>
        {brandStrip}
        <div className="space-y-2">
          <h3 className="font-heading text-lg leading-snug tracking-tight text-foreground">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        </div>
        <div className="flex items-start justify-between gap-3">
          {product.compatibleCars.length > 0 ? (
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className={metaLabelClass}>Vehicle fit</p>
              <VehicleCompatibilityTags
                slugs={product.compatibleCars}
                maxVisible={3}
                link
              />
            </div>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <div className="flex shrink-0 flex-col items-start space-y-1.5">
            <p className={metaLabelClass}>Price</p>
            {priceBadge}
          </div>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <AddToCartButton product={product} className="flex-1 shadow-none" />
          <a
            href={whatsappHref(whatsappProductInterest(product.name))}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex-1 justify-center text-center shadow-none"
            )}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </motion.article>
  );
});
