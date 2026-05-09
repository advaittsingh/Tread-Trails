import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";

import { absoluteUrl, siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteShell } from "@/components/layout/site-shell";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tread Trails | Premium Off-Road & Expedition Lab",
    template: "%s | Tread Trails",
  },
  description:
    "Luxury automotive upgrades — expedition chassis tuning, curated accessories, portfolio installations, and concierge fitting.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Tread Trails",
    title: "Tread Trails | Premium Off-Road & Expedition Lab",
    description:
      "Luxury automotive upgrades — expedition-grade builds and curated accessories.",
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
      "Luxury automotive upgrades — expedition-grade builds and curated accessories.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(playfair.variable, inter.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
