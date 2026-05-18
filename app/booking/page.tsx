import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { BookingForm } from "@/components/booking/booking-form";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Book appointment",
  description:
    "Reserve bay time for installation or consultation — pick your vehicle, service focus, and preferred slot. Submit your contact details; the studio confirms timing separately.",
  path: "/booking",
});

function BookingFallback() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-border/70 bg-card p-8 shadow-card">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex justify-end pt-4">
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <MarketingPageShell background="tread">
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow="Bay allocation"
        title="Reserve studio time"
        description="Tell us which chassis you’re bringing and what we’re fitting — we’ll align calendars across Bengaluru, Mumbai, and Dubai routing."
        className="mx-auto mb-14 max-w-2xl"
      />
      <Suspense fallback={<BookingFallback />}>
        <BookingForm />
      </Suspense>
    </MarketingPageShell>
  );
}
