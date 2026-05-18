"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { PrimaryCta } from "@/components/marketing/cta-buttons";
import { buttonVariants } from "@/components/ui/button";

export function HomeHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2400&q=80"
          alt="Premium off-road vehicle in a studio setting"
          fill
          priority
          className="object-cover object-center transition-transform duration-[1.2s] ease-out"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/88 via-42% to-transparent to-78%" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent via-40% to-transparent" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
        <div className="max-w-3xl space-y-8">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="font-sans text-[10px] font-semibold tracking-[0.48em] text-primary uppercase"
          >
            Expedition atelier
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="heading-cinematic font-heading-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          >
            Terrain,
            <span className="mt-1 block text-muted-foreground">refined.</span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="max-w-xl text-lg font-normal leading-relaxed text-muted-foreground md:text-xl"
          >
            Vehicle-native kits, armor, and lighting programs engineered with OEM discipline —
            delivered with boutique studio care.
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="flex flex-wrap gap-3"
          >
            <PrimaryCta href="/booking">Book appointment</PrimaryCta>
            <Link
              href="/vehicles"
              className={cn(buttonVariants({ variant: "outline", size: "brand" }))}
            >
              Explore vehicles
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
