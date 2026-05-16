"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { Car } from "@/data/types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CarCardProps = {
  car: Car;
  index?: number;
  /** Defaults to vehicle detail (compatible parts & builds). */
  href?: string;
  /** Narrow card for horizontal strips (e.g. homepage). */
  variant?: "default" | "compact";
  className?: string;
};

export const CarCard = memo(function CarCard({
  car,
  index = 0,
  href,
  variant = "default",
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
        "group relative",
        compact && !className && "w-[min(240px,78vw)] shrink-0 snap-start sm:w-[260px]",
        className
      )}
    >
      <Link
        href={dest}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${car.name} — vehicle hub with compatible parts and portfolio builds`}
      >
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card transition-shadow duration-300 hover:shadow-card-hover",
            compact && "rounded-lg shadow-sm hover:shadow-card"
          )}
        >
          <div
            className={cn(
              "relative aspect-[4/3] bg-muted",
              compact && "aspect-[5/3]"
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
              className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>

          <div
            className={cn(
              "flex items-start gap-4 border-t border-border/60 px-4 py-4 sm:px-5 sm:py-5",
              compact && "gap-3 px-3 py-3 sm:px-3.5 sm:py-3.5"
            )}
          >
            <div className={cn("min-w-0 flex-1 space-y-2", compact && "space-y-1.5")}>
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full border border-border/60 bg-muted/80 text-[10px] tracking-widest text-foreground uppercase",
                  compact && "text-[9px] tracking-[0.2em]"
                )}
              >
                {car.category}
              </Badge>
              <h3
                className={cn(
                  "font-heading text-xl leading-tight tracking-tight text-foreground sm:text-2xl",
                  compact && "text-base sm:text-lg"
                )}
              >
                {car.name}
              </h3>
              <p
                className={cn(
                  "text-sm leading-relaxed text-muted-foreground",
                  compact && "text-xs leading-snug line-clamp-2"
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
      </Link>
    </motion.article>
  );
});
