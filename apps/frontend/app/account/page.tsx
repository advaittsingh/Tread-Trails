import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { AccountDashboard } from "@/components/account/account-dashboard";
import { AccountToolbar } from "@/components/account/account-toolbar";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Account",
  description:
    "Profile settings, orders, bookings, saved vehicles, wishlists, and preferred chassis — synced when you sign in.",
  path: "/account",
  robots: { index: false, follow: true },
});

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          titleAs="h1"
          eyebrow="Driver lounge"
          title="Account overview"
          description="Profile, orders, and bookings sync from Neon (Postgres). Saved platforms, your selected chassis, and wishlisted SKUs sync to your account when signed in — guest hearts merge into cloud storage on login."
          className="max-w-2xl"
        />
        <AccountToolbar />
      </div>
      <AccountDashboard />
    </div>
  );
}
