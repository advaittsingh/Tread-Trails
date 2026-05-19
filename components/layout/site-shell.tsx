"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { useCompare } from "@/contexts/compare-context";
import { cn } from "@/lib/utils";

import { Footer } from "@/components/layout/footer";
import { SiteTextureBackdrop } from "@/components/layout/site-texture-backdrop";

const ComparisonTray = dynamic(
  () =>
    import("@/components/compare/comparison-tray").then((m) => ({
      default: m.ComparisonTray,
    })),
  { loading: () => null }
);

const BackToTop = dynamic(
  () =>
    import("@/components/layout/back-to-top").then((m) => ({
      default: m.BackToTop,
    })),
  { loading: () => null }
);

const WhatsAppFloat = dynamic(
  () =>
    import("@/components/layout/whatsapp-float").then((m) => ({
      default: m.WhatsAppFloat,
    })),
  { loading: () => null }
);

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const { hydrated: compareHydrated, count: compareCount } = useCompare();
  const compareTrayPad =
    compareHydrated &&
    compareCount > 0 &&
    !isAdmin &&
    pathname !== "/compare";

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">{children}</div>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:text-foreground focus-visible:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Skip to main content
      </a>
      <SiteTextureBackdrop />
      <main
        id="main-content"
        className={cn(
          "relative z-10 min-h-[70vh] pt-14",
          compareTrayPad && "pb-24 sm:pb-[5.5rem]"
        )}
      >
        {children}
      </main>
      <Footer />
      <ComparisonTray />
      <BackToTop />
      <WhatsAppFloat />
    </>
  );
}
