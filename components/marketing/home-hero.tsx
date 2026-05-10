"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";

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
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Readable type on the left; photo stays visible toward center/right */}
        <div className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/88 via-42% to-transparent to-78%" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent via-40% to-transparent" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
        <div className="max-w-3xl space-y-8">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="font-heading text-xs tracking-[0.45em] text-primary uppercase"
          >
            Expedition-grade builds
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-heading text-balance text-5xl leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Terrain,
            <span className="block text-muted-foreground">refined.</span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
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
            <PrimaryCta href="/booking" className="h-11 px-6 text-base shadow-card">
              Book appointment
            </PrimaryCta>
            <WhatsAppCta
              message="Hi — I'd like to discuss a build with Tread Trails."
              label="WhatsApp concierge"
              className="h-11 px-6 text-base"
              variant="outline"
            />
            <Link
              href="/vehicles"
              className="inline-flex h-11 items-center rounded-md px-4 text-sm tracking-wide text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Explore vehicles
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
