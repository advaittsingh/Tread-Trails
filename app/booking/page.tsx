import type { Metadata } from "next";
import { Suspense } from "react";

import { absoluteUrl } from "@/lib/site";

import { BookingForm } from "@/components/booking/booking-form";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Book appointment",
  alternates: { canonical: absoluteUrl("/booking") },
};

function BookingFallback() {
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-border/70 bg-card p-8 shadow-card">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex justify-between pt-4">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        align="center"
        eyebrow="Bay allocation"
        title="Reserve studio time"
        description="Arrive from vehicles, products, or builds — URL parameters pre-fill context for your concierge team."
        className="mx-auto mb-14 max-w-2xl"
      />
      <Suspense fallback={<BookingFallback />}>
        <BookingForm />
      </Suspense>
    </div>
  );
}
