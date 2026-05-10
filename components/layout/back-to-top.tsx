"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

import { useCompare } from "@/contexts/compare-context";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export function BackToTop() {
  const pathname = usePathname();
  const { hydrated: compareHydrated, count: compareCount } = useCompare();
  const [visible, setVisible] = useState(false);

  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const trayVisible =
    compareHydrated &&
    compareCount > 0 &&
    !isAdmin &&
    pathname !== "/compare";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isAdmin) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label="Back to top"
      className={cn(
        "fixed left-4 z-[45] size-11 rounded-full border border-border/80 bg-background/95 shadow-card backdrop-blur-md transition-[opacity,transform,bottom] duration-300 md:left-8",
        trayVisible ? "bottom-24 md:bottom-[7.25rem]" : "bottom-6 md:bottom-8",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
      onClick={() =>
        window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
      }
    >
      <ArrowUp className="size-5" aria-hidden />
    </Button>
  );
}
