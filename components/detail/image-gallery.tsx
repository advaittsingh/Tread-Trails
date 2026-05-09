"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type ImageGalleryProps = {
  images: string[];
  alt: string;
};

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const safe = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  if (!safe.length) return null;

  return (
    <div className="space-y-4">
      <motion.div
        key={active}
        initial={reduceMotion ? false : { opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22 }}
        className="relative aspect-square overflow-hidden rounded-xl bg-muted/40 shadow-card ring-1 ring-border/60 sm:aspect-[5/4]"
      >
        <Image
          src={safe[active]}
          alt={`${alt} — photo ${active + 1} of ${safe.length}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 55vw"
          priority
        />
      </motion.div>
      {safe.length > 1 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label={`${alt} gallery thumbnails`}
        >
          {safe.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              aria-pressed={i === active}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-20",
                i === active && "ring-primary shadow-card"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
