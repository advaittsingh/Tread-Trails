import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { CorporateInquiryForm } from "@/components/corporate-inquiry/corporate-inquiry-form";
import { SectionHeading } from "@/components/marketing/section-heading";

const description =
  "Fleet programmes, reseller partnerships, and corporate procurement for expedition-grade upgrades. Brief us on volumes, vehicle platforms, regions, and timelines — our partnerships desk typically replies within two business days.";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Corporate inquiry",
  description,
  path: "/corporate-inquiry",
});

export default function CorporateInquiryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow="Partnerships"
        title="Corporate & fleet"
        description={description}
        className="mx-auto mb-12 max-w-2xl lg:mb-14"
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <CorporateInquiryForm />
      </div>
    </div>
  );
}
