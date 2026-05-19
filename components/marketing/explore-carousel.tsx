"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EXPLORE_CAROUSEL_CARD_H } from "@/lib/explore-card-layout";
import { cn } from "@/lib/utils";

const GAP_PX = 16;

function visibleCountForWidth(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
}

export type ExploreCarouselProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  ariaLabel: string;
  renderSlide: (item: T, index: number) => ReactNode;
};

export function ExploreCarousel<T>({
  items,
  getKey,
  ariaLabel,
  renderSlide,
}: ExploreCarouselProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const count = visibleCountForWidth(viewport.clientWidth);
    const paddingRight = Number.parseFloat(
      getComputedStyle(viewport).paddingRight
    );
    const availableWidth = viewport.clientWidth - paddingRight;
    const width =
      count > 0 ? (availableWidth - GAP_PX * (count - 1)) / count : 0;

    setVisibleCount(count);
    setSlideWidth(width);

    const maxScroll = track.scrollWidth - availableWidth;
    setCanScrollLeft(track.scrollLeft > 4);
    setCanScrollRight(track.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    updateMetrics();
    const observer = new ResizeObserver(() => updateMetrics());
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [updateMetrics, items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => updateMetrics();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [updateMetrics]);

  const scrollByStep = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track || slideWidth <= 0) return;
    track.scrollBy({
      left: direction * (slideWidth + GAP_PX),
      behavior: "smooth",
    });
  };

  const showArrows = items.length > visibleCount;

  return (
    <div className="relative min-w-0">
      <div
        ref={viewportRef}
        className={cn("overflow-hidden", showArrows && "pr-12 sm:pr-14")}
        role="region"
        aria-label={ariaLabel}
      >
        <div
          ref={trackRef}
          className={cn(
            "no-scrollbar flex items-stretch gap-4 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 pt-0.5",
            EXPLORE_CAROUSEL_CARD_H
          )}
        >
          {items.map((item, i) => (
            <div
              key={getKey(item)}
              className="flex h-full shrink-0 flex-col"
              style={slideWidth > 0 ? { width: slideWidth } : undefined}
            >
              {renderSlide(item, i)}
            </div>
          ))}
        </div>
      </div>

      {showArrows ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-14 items-center justify-end bg-gradient-to-l from-background via-background/80 to-transparent sm:w-16">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "pointer-events-auto size-9 rounded-full border-border/80 bg-background shadow-sm",
              !canScrollRight && "pointer-events-none opacity-40"
            )}
            onClick={() => scrollByStep(1)}
            disabled={!canScrollRight}
            aria-label="Show more items"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      ) : null}

      {showArrows && canScrollLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-14 items-center justify-start bg-gradient-to-r from-background via-background/80 to-transparent sm:w-16">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="pointer-events-auto size-9 rounded-full border-border/80 bg-background shadow-sm"
            onClick={() => scrollByStep(-1)}
            aria-label="Show previous items"
          >
            <ChevronLeft className="size-5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
