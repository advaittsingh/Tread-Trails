import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getCmsPage } from "@/lib/server/cms";
import { withPlainAmpersand } from "@/lib/plain-ampersand";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { CorporateInquiryForm } from "@/components/corporate-inquiry/corporate-inquiry-form";
import { SectionHeading } from "@/components/marketing/section-heading";

const fallbackDescription =
  "Fleet programmes, reseller partnerships, and corporate procurement for expedition-grade upgrades. Brief us on volumes, vehicle platforms, regions, and timelines — our partnerships desk typically replies within two business days.";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("corporate-inquiry");
  return buildPageMetadata({
    segmentTitle: page?.seoTitle || "Corporate inquiry",
    description: page?.seoDescription || page?.description || fallbackDescription,
    path: "/corporate-inquiry",
  });
}

export default async function CorporateInquiryPage() {
  const page = await getCmsPage("corporate-inquiry");
  const title = page?.title || withPlainAmpersand("Corporate & fleet");

  return (
    <MarketingPageShell>
      <SectionHeading
        titleAs="h1"
        align="center"
        eyebrow={page?.eyebrow || "Partnerships"}
        title={title}
        description={page?.description || fallbackDescription}
        className="mx-auto mb-12 max-w-2xl lg:mb-14"
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <CorporateInquiryForm />
      </div>
    </MarketingPageShell>
  );
}
