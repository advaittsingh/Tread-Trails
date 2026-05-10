import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

const OG_DIM = { width: 1200, height: 630 };

export function defaultOgImage(alt: string) {
  return {
    url: absoluteUrl("/opengraph-image"),
    ...OG_DIM,
    alt,
  };
}

/** CDN / absolute / site-relative paths → absolute URL for OG tags */
export function absoluteOgAsset(src: string | undefined | null): string | undefined {
  if (!src?.trim()) return undefined;
  const s = src.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return absoluteUrl(s.startsWith("/") ? s : `/${s}`);
}

/**
 * Consistent title template segment + OG/Twitter/canonical for marketing pages.
 * Document title uses root `template` → `${segmentTitle} | Tread Trails`.
 */
export function buildPageMetadata(opts: {
  segmentTitle: string;
  description: string;
  path: string;
  ogImageUrl?: string | null;
  ogImageAlt?: string;
  /** Use when `segmentTitle` alone isn’t enough for sharing */
  socialTitle?: string;
  openGraphType?: "website" | "article";
  robots?: Metadata["robots"];
}): Metadata {
  const url = absoluteUrl(opts.path);
  const compositeSocial = opts.socialTitle ?? `${opts.segmentTitle} | Tread Trails`;
  const ogImages =
    opts.ogImageUrl && opts.ogImageUrl.length > 0
      ? [
          {
            url: opts.ogImageUrl,
            ...OG_DIM,
            alt: opts.ogImageAlt ?? opts.segmentTitle,
          },
        ]
      : [defaultOgImage(opts.ogImageAlt ?? opts.segmentTitle)];

  return {
    title: opts.segmentTitle,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.robots,
    openGraph: {
      title: compositeSocial,
      description: opts.description,
      url,
      siteName: "Tread Trails",
      locale: "en_IN",
      type: opts.openGraphType ?? "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: compositeSocial,
      description: opts.description,
      images: ogImages.map((i) => i.url),
    },
  };
}
