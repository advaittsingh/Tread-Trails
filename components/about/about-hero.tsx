"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";

export function AboutHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=2400&q=80"
          alt="Off-road vehicle landscape — expedition context"
          fill
          priority
          className="object-cover object-[center_65%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/90 via-48% to-background/55 to-100%" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent via-35% to-transparent" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="font-sans text-[11px] font-medium tracking-[0.42em] text-primary uppercase"
          >
            About Tread Trails
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="heading-cinematic font-heading-display text-4xl leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Engineers,
            <span className="block text-muted-foreground">with studio craft.</span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
          >
            We design and deliver expedition-grade upgrades — suspension, armor, lighting, and
            curated accessories — with OEM discipline and concierge-level fitting.
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="flex flex-wrap gap-3"
          >
            <PrimaryCta href="/contact" className="h-11 px-6 text-base shadow-card">
              Talk to us
            </PrimaryCta>
            <WhatsAppCta
              message="Hi — I'd like to learn more about Tread Trails."
              label="WhatsApp"
              className="h-11 px-6 text-base"
              variant="outline"
            />
            <Link
              href="/builds"
              className="inline-flex h-11 items-center px-4 text-sm tracking-wide text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View builds
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
