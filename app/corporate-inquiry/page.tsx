import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { CorporateInquiryForm } from "@/components/corporate-inquiry/corporate-inquiry-form";
import { SectionHeading } from "@/components/marketing/section-heading";
import { withPlainAmpersand } from "@/lib/plain-ampersand";

const description =
  "Fleet programmes, reseller partnerships, and corporate procurement for expedition-grade upgrades. Brief us on volumes, vehicle platforms, regions, and timelines — our partnerships desk typically replies within two business days.";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Corporate inquiry",
  description,
  path: "/corporate-inquiry",
});

export default function CorporateInquiryPage() {
  return (
    <MarketingPageShell background="mud">
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow="Partnerships"
        title={withPlainAmpersand("Corporate & fleet")}
        description={description}
        className="mx-auto mb-12 max-w-2xl lg:mb-14"
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <CorporateInquiryForm />
      </div>
    </MarketingPageShell>
  );
}
