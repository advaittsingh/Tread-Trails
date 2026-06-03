"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { PrimaryCta, WhatsAppCta } from "@/components/marketing/cta-buttons";
import { cn } from "@/lib/utils";

export function AboutHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="group relative isolate overflow-hidden border-b border-border/50 bg-background">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=2400&q=80"
          alt="Off-road vehicle landscape — expedition context"
          fill
          priority
          className={cn(
            "object-cover object-[center_65%] motion-image-zoom motion-reduce:transition-none",
            "motion-reduce:transform-none"
          )}
          sizes="100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background from-0% via-background/92 via-48% to-background/55 to-100%" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/82 via-transparent via-35% to-transparent" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-32 lg:px-8 lg:pb-32 lg:pt-36">
        <div className="max-w-3xl space-y-10 sm:space-y-11">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="type-eyebrow-tight"
          >
            About Tread Trails
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="type-hero font-heading-display text-[clamp(2rem,7vw,4rem)] leading-[0.98] sm:text-[clamp(2.5rem,6.5vw,4.75rem)] md:text-[clamp(3rem,5.5vw,5.25rem)] lg:text-[clamp(3.5rem,4.8vw,5rem)]"
          >
            Engineers,
            <span className="mt-2 block normal-case tracking-[-0.02em] text-muted-foreground">
              with studio craft.
            </span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="type-body-lede max-w-xl"
          >
            We design and deliver expedition-grade upgrades — suspension, armor, lighting, and
            curated accessories — with OEM discipline and concierge-level fitting.
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <PrimaryCta href="/contact" className="h-11 px-8">
              Talk to us
            </PrimaryCta>
            <WhatsAppCta
              message="Hi — I'd like to learn more about Tread Trails."
              label="WhatsApp"
              className="h-11 px-8"
              variant="outline"
            />
            <Link
              href="/builds"
              className="inline-flex h-11 items-center px-2 text-sm font-medium tracking-wide text-muted-foreground underline-offset-4 transition-colors duration-300 ease-tt-out hover:text-foreground hover:underline"
            >
              View builds
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
