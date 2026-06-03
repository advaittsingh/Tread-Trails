"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealSectionProps = {
  children: ReactNode;
  className?: string;
  /** Slight stagger when multiple sections mount together */
  delay?: number;
};

/** Subtle fade-up on scroll — premium editorial motion (respects reduced motion). */
export function RevealSection({ children, className, delay = 0 }: RevealSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px 0px -8% 0px" }}
      transition={{
        duration: reduceMotion ? 0 : 0.75,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.section>
  );
}
