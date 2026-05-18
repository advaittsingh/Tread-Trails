import type { Metadata, Viewport } from "next";

import "./globals.css";
import { absoluteUrl, siteUrl } from "@/lib/site";
import { headingFont } from "@/lib/fonts";
import { Suspense } from "react";

import { getNavCatalogueData } from "@/lib/server/nav-catalogue-data";
import { listProducts } from "@/lib/server/product-catalog";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SiteJsonLd } from "@/components/seo/site-json-ld";

/** Explicit viewport helps mobile audits (Lighthouse SEO / Best practices). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tread Trails | Premium Off-Road & Expedition Lab",
    template: "%s | Tread Trails",
  },
  description:
    "Expedition-grade automotive upgrades — suspension, armor, lighting, and curated accessories with boutique studio fitting in Bengaluru, Mumbai, and Dubai.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Tread Trails",
    title: "Tread Trails | Premium Off-Road & Expedition Lab",
    description:
      "Expedition-grade chassis tuning, curated SKUs, portfolio installs, and concierge checkout.",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Tread Trails",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tread Trails | Premium Off-Road & Expedition Lab",
    description:
      "Expedition-grade chassis tuning, curated SKUs, portfolio installs, and concierge checkout.",
    images: [absoluteUrl("/opengraph-image")],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [catalogue, catalogProducts] = await Promise.all([
    getNavCatalogueData(),
    listProducts(),
  ]);

  return (
    <html lang="en" className={headingFont.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SiteJsonLd />
        <AppProviders catalogProducts={catalogProducts}>
          <Suspense fallback={null}>
            <SiteChrome catalogue={catalogue}>{children}</SiteChrome>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
