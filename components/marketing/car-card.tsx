"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { Car } from "@/data/types";

import { Badge } from "@/components/ui/badge";
import { cardShellClass } from "@/lib/card-surfaces";
import { EXPLORE_CAROUSEL_CARD_H } from "@/lib/explore-card-layout";
import { cn } from "@/lib/utils";

type CarCardProps = {
  car: Car;
  index?: number;
  /** Defaults to vehicle detail (compatible parts & builds). */
  href?: string;
  /** Narrow card for horizontal strips (e.g. homepage). */
  variant?: "default" | "compact";
  /** Glass panel on textured site background. */
  onTextureBg?: boolean;
  className?: string;
};

export const CarCard = memo(function CarCard({
  car,
  index = 0,
  href,
  variant = "default",
  onTextureBg = false,
  className,
}: CarCardProps) {
  const dest = href ?? `/vehicle/${car.slug}`;
  const reduceMotion = useReducedMotion();
  const compact = variant === "compact";

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
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className={cn(
        "group relative flex h-full flex-col",
        compact && !className && "w-[min(240px,78vw)] shrink-0 snap-start sm:w-[260px]",
        className
      )}
    >
      <Link
        href={dest}
        className="flex h-full min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${car.name} — vehicle hub with compatible parts and portfolio builds`}
      >
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden rounded-xl transition-shadow duration-300 hover:shadow-card-hover",
            cardShellClass(onTextureBg),
            compact && ["rounded-lg shadow-sm hover:shadow-card", "h-full", EXPLORE_CAROUSEL_CARD_H]
          )}
        >
          <div
            className={cn(
              "relative w-full shrink-0",
              compact ? "aspect-[5/3]" : "aspect-[4/3]",
              onTextureBg ? "bg-muted/80" : "bg-muted"
            )}
          >
            <Image
              src={car.thumbnail}
              alt=""
              fill
              aria-hidden
              sizes={
                compact
                  ? "(max-width: 640px) 78vw, 260px"
                  : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              }
              className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.05]"
              loading="lazy"
            />
          </div>

          <div
            className={cn(
              "flex flex-1 flex-col border-t",
              onTextureBg ? "border-primary/15 bg-background/85" : "border-border/60",
              compact ? "min-h-[8.75rem] px-3 py-3 sm:px-3.5 sm:py-3.5" : "px-4 py-4 sm:px-5 sm:py-5"
            )}
          >
            <div className="flex min-h-0 flex-1 items-start gap-3 sm:gap-4">
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col space-y-2",
                  compact && "space-y-1.5"
                )}
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    "w-fit rounded-full border text-[10px] tracking-widest text-foreground uppercase",
                    onTextureBg
                      ? "border-primary/15 bg-secondary/70"
                      : "border-border/60 bg-muted/80",
                    compact && "text-[9px] tracking-[0.2em]"
                  )}
                >
                  {car.category}
                </Badge>
                <h3
                  className={cn(
                    "font-heading line-clamp-2 font-semibold leading-tight tracking-tight text-foreground",
                    compact
                      ? "min-h-[2.75em] text-base sm:text-lg"
                      : "text-xl sm:text-2xl"
                  )}
                >
                  {car.name}
                </h3>
                <p
                  className={cn(
                    "line-clamp-2 text-sm leading-relaxed text-muted-foreground",
                    compact ? "min-h-[2.5em] text-xs leading-snug" : ""
                  )}
                >
                  {car.tagline}
                </p>
              </div>
              <span
                className={cn(
                  "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary",
                  compact && "size-8"
                )}
                aria-hidden
              >
                <ArrowUpRight className={cn(compact ? "size-4" : "size-5")} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
});
