import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import {
  fetchTreadTrailsYoutubeFeed,
  TREAD_TRAILS_YOUTUBE_CHANNEL_URL,
} from "@/lib/youtube/tread-trails-feed";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const description =
  "Watch installs, tyre and wheel guides, and build stories from the Tread Trails YouTube channel — expedition 4x4 and studio work in one place.";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Youtube",
  description,
  path: "/youtube",
});

function formatPublished(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function YoutubePage() {
  const videos = await fetchTreadTrailsYoutubeFeed(15);

  return (
    <MarketingPageShell>
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow="Video"
        title="Tread Trails on YouTube"
        description={description}
        className="mx-auto mb-8 max-w-2xl lg:mb-10"
      />

      <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <a
          href={TREAD_TRAILS_YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "gap-2"
          )}
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          Open channel on YouTube
        </a>
        <Link
          href="/products"
          className={buttonVariants({ variant: "outline", size: "default" })}
        >
          Browse products
        </Link>
      </div>

      {videos.length === 0 ? (
        <p className="mx-auto max-w-lg text-center text-muted-foreground">
          We couldn&apos;t load the latest videos right now. Please open the
          channel on YouTube —{" "}
          <a
            href={TREAD_TRAILS_YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            @TreadTrails
          </a>
          .
        </p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <li key={v.videoId}>
              <article className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.videoId}`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    className="size-full border-0"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h2 className="text-sm font-semibold leading-snug text-foreground line-clamp-3">
                    {v.title}
                  </h2>
                  {v.publishedIso ? (
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={v.publishedIso}
                    >
                      {formatPublished(v.publishedIso)}
                    </time>
                  ) : null}
                  <a
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Watch on YouTube
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </MarketingPageShell>
  );
}
