import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { ComparePageContent } from "@/components/compare/compare-page-content";

export const metadata: Metadata = buildPageMetadata({
  segmentTitle: "Compare products",
  description:
    "Compare up to four compatible accessories side by side — INR pricing, brand, vehicle fitment, and on-page specifications before you decide.",
  path: "/compare",
});

export default function ComparePage() {
  return (
    <MarketingPageShell>
      <ComparePageContent />
    </MarketingPageShell>
  );
}
