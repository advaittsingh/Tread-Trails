import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { ContactForm } from "@/components/contact/contact-form";
import { SectionHeading } from "@/components/marketing/section-heading";

const description =
  "Reach Tread Trails for expedition upgrades, bay bookings, and fleet questions — use the form, email the concierge, or message us on WhatsApp. Studios in Bengaluru, Mumbai, and Dubai by appointment.";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Contact",
  description,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow="Concierge"
        title="Contact the studio"
        description={description}
        className="mx-auto mb-12 max-w-2xl lg:mb-14"
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <ContactForm />
      </div>
    </MarketingPageShell>
  );
}
