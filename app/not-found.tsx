import Link from "next/link";

import { PrimaryCta } from "@/components/marketing/cta-buttons";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-heading text-xs tracking-[0.4em] text-primary uppercase">
        404
      </p>
      <h1 className="mt-4 font-heading text-4xl tracking-tight md:text-5xl">
        Route not indexed.
      </h1>
      <p className="mt-4 text-muted-foreground">
        This chassis code isn&apos;t in our navigation graph yet — return to base camp.
      </p>
      <PrimaryCta href="/" className="mt-8 px-8">
        Back home
      </PrimaryCta>
      <Link
        href="/vehicles"
        className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Browse vehicles
      </Link>
    </div>
  );
}
