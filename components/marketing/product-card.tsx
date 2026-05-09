"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { getBrandVisualForProduct } from "@/data/advven-brands";
import type { Product } from "@/data/types";
import { formatInr } from "@/lib/format";
import { whatsappHref, whatsappProductInterest } from "@/lib/whatsapp";

import { cn } from "@/lib/utils";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistToggle } from "@/components/wishlist/wishlist-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

type ProductCardProps = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const reduceMotion = useReducedMotion();
  const priceLabel = formatInr(product.price);
  const brandVis = getBrandVisualForProduct(product);

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
        <WishlistToggle
          productSlug={product.slug}
          label={product.name}
          className="absolute top-3 right-3 z-10 shadow-card"
        />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1] flex flex-wrap items-center gap-2">
          <Badge className="flex max-w-[calc(100%-5rem)] items-center gap-1.5 rounded-full bg-background/95 py-1 pr-2 pl-1.5 text-[10px] tracking-wide uppercase shadow-card backdrop-blur">
            {brandVis.logoSrc ? (
              <Image
                src={brandVis.logoSrc}
                alt=""
                width={22}
                height={22}
                className="size-[22px] shrink-0 object-contain"
              />
            ) : null}
            <span className="truncate normal-case">{brandVis.label}</span>
          </Badge>
          {priceLabel ? (
            <Badge variant="secondary" className="rounded-full text-[10px] shadow-card">
              {priceLabel}
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full border-border/80 bg-background/95 text-[10px] shadow-card">
              POA
            </Badge>
          )}
        </div>
      </div>
      <div className="relative z-[2] flex flex-1 flex-col gap-4 bg-card p-5">
        <div className="space-y-2">
          <h3 className="font-heading text-lg leading-snug tracking-tight text-foreground">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
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
}
