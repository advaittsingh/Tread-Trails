import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

import { AccountDashboard } from "@/components/account/account-dashboard";
import { AccountToolbar } from "@/components/account/account-toolbar";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Account",
  alternates: { canonical: absoluteUrl("/account") },
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Driver lounge"
          title="Account overview"
          description="Orders and bookings sync from MongoDB. Saved vehicles and wishlists stay on this device."
          className="max-w-2xl"
        />
        <AccountToolbar />
      </div>
      <AccountDashboard />
    </div>
  );
}
