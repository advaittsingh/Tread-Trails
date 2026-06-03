"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";
import { PrimaryCta } from "@/components/marketing/cta-buttons";
import { buttonVariants } from "@/components/ui/button";

export type HomeHeroContent = {
  eyebrow?: string;
  title?: string;
  titleAccent?: string;
  description?: string;
  imageUrl?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

const DEFAULTS: Required<HomeHeroContent> = {
  eyebrow: "Expedition atelier",
  title: "Terrain,",
  titleAccent: "refined.",
  description:
    "Vehicle-native kits, armor, and lighting programs engineered with OEM discipline — delivered with boutique studio care.",
  imageUrl:
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2400&q=80",
  primaryCtaLabel: "Book appointment",
  primaryCtaHref: "/booking",
  secondaryCtaLabel: "Explore vehicles",
  secondaryCtaHref: "/vehicles",
};

export function HomeHero({ content }: { content?: HomeHeroContent }) {
  const hero = { ...DEFAULTS, ...content };
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxPx = reduceMotion ? 0 : 52;
  const imageY = useTransform(scrollYProgress, [0, 1], [0, parallaxPx]);

  return (
    <section
      ref={sectionRef}
      className="group relative isolate overflow-hidden border-b border-border/50 bg-background"
    >
      <motion.div style={{ y: imageY }} className="absolute inset-0 will-change-transform">
        <Image
          src={hero.imageUrl}
          alt={hero.title}
          fill
          priority
          className={cn(
            "object-cover object-center motion-image-zoom motion-reduce:transition-none",
            "motion-reduce:transform-none"
          )}
          sizes="100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background from-0% via-background/92 via-44% to-transparent to-76%" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent via-38% to-transparent" />
      </motion.div>
      <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-32 lg:px-8 lg:pb-36 lg:pt-40">
        <div className="max-w-3xl space-y-10 lg:space-y-12">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="type-eyebrow"
          >
            {hero.eyebrow}
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="type-hero font-heading-display text-[clamp(2.25rem,8vw,4.25rem)] leading-[0.98] sm:text-[clamp(2.75rem,7.5vw,5rem)] md:text-[clamp(3.25rem,6.5vw,5.5rem)] lg:text-[clamp(3.75rem,5.5vw,5.25rem)]"
          >
            {hero.title}
            <span className="mt-2 block normal-case tracking-[-0.02em] text-muted-foreground">
              {hero.titleAccent}
            </span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="type-body-lede max-w-xl"
          >
            {hero.description}
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <PrimaryCta href={hero.primaryCtaHref}>{hero.primaryCtaLabel}</PrimaryCta>
            <Link
              href={hero.secondaryCtaHref}
              className={cn(buttonVariants({ variant: "outline", size: "brand" }))}
            >
              {hero.secondaryCtaLabel}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
