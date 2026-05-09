"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">{children}</div>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:shadow-card focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-25%,oklch(0.34_0.078_155_/_0.06),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-lux-grid bg-grid opacity-[0.35]"
      />
      <Navbar />
      <main id="main-content" className="min-h-[70vh] pt-16">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
