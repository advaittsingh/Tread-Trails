import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getCmsPage } from "@/lib/server/cms";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { ContactForm } from "@/components/contact/contact-form";
import { SectionHeading } from "@/components/marketing/section-heading";

const fallbackDescription =
  "Reach Tread Trails for expedition upgrades, bay bookings, and fleet questions — use the form, email the concierge, or message us on WhatsApp. Studios in Bengaluru, Mumbai, and Dubai by appointment.";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("contact");
  return buildPageMetadata({
    segmentTitle: page?.seoTitle || "Contact",
    description: page?.seoDescription || page?.description || fallbackDescription,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const page = await getCmsPage("contact");
  const description = page?.description || fallbackDescription;

  return (
    <MarketingPageShell>
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow={page?.eyebrow || "Concierge"}
        title={page?.title || "Contact the studio"}
        description={description}
        className="mx-auto mb-12 max-w-2xl lg:mb-14"
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <ContactForm />
      </div>
    </MarketingPageShell>
  );
}
