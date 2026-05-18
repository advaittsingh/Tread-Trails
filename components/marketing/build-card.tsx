"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import type { Build } from "@/data/types";

import { cardContentClass, cardShellClass } from "@/lib/card-surfaces";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

type BuildCardProps = {
  build: Build;
  vehicleName?: string;
  index?: number;
  /** Cream surfaces for textured homepage sections. */
  onTextureBg?: boolean;
};

export const BuildCard = memo(function BuildCard({
  build,
  vehicleName,
  index = 0,
  onTextureBg = false,
}: BuildCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: reduceMotion ? 0 : 0.42,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={cn(
        "group overflow-hidden rounded-xl transition-shadow hover:shadow-card-hover",
        cardShellClass(onTextureBg)
      )}
    >
      <Link href={`/build/${build.slug}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div
          className={cn(
            "grid grid-cols-2 gap-px",
            onTextureBg ? "bg-primary/10" : "bg-foreground/10"
          )}
        >
          <div className="relative aspect-[5/4] overflow-hidden">
            <Image
              src={build.beforeImage}
              alt={`${build.title} before`}
              fill
              className="object-cover grayscale transition duration-700 group-hover:grayscale-0"
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
            />
            <span
              className={cn(
                "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] tracking-widest uppercase backdrop-blur",
                onTextureBg ? "bg-background/85" : "bg-background/70"
              )}
            >
              Before
            </span>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden">
            <Image
              src={build.afterImage}
              alt={`${build.title} after`}
              fill
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
            />
            <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] tracking-widest text-primary-foreground uppercase">
              After
            </span>
          </div>
        </div>
        <div className={cn("space-y-3 p-5", cardContentClass(onTextureBg))}>
          <div className="flex flex-wrap items-center gap-2">
            {vehicleName ? (
              <Badge variant="secondary" className="rounded-full text-[10px] tracking-wide uppercase">
                {vehicleName}
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[10px] tracking-wide uppercase",
                onTextureBg ? "border-border/60" : "border-white/15"
              )}
            >
              Portfolio
            </Badge>
          </div>
          <h3 className="font-heading text-xl tracking-tight transition group-hover:text-primary">
            {build.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{build.summary}</p>
        </div>
      </Link>
    </motion.article>
  );
});
