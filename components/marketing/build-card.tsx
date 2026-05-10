"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import type { Build } from "@/data/types";

import { Badge } from "@/components/ui/badge";

type BuildCardProps = {
  build: Build;
  vehicleName?: string;
  index?: number;
};

export const BuildCard = memo(function BuildCard({
  build,
  vehicleName,
  index = 0,
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
      className="group overflow-hidden rounded-xl border border-border/70 bg-card shadow-card transition-shadow hover:shadow-card-hover"
    >
      <Link href={`/build/${build.slug}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="grid grid-cols-2 gap-px bg-foreground/10">
          <div className="relative aspect-[5/4] overflow-hidden">
            <Image
              src={build.beforeImage}
              alt={`${build.title} before`}
              fill
              className="object-cover grayscale transition duration-700 group-hover:grayscale-0"
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
            />
            <span className="absolute left-2 top-2 rounded-full bg-background/70 px-2 py-0.5 text-[10px] tracking-widest uppercase backdrop-blur">
              Before
            </span>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden">
            <Image
              src={build.afterImage}
              alt={`${build.title} after`}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
            />
            <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] tracking-widest text-primary-foreground uppercase">
              After
            </span>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {vehicleName ? (
              <Badge variant="secondary" className="rounded-full text-[10px] tracking-wide uppercase">
                {vehicleName}
              </Badge>
            ) : null}
            <Badge variant="outline" className="rounded-full border-white/15 text-[10px] tracking-wide uppercase">
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
