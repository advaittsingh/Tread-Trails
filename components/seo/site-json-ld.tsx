import {
  getOrganizationJsonLd,
  getWebsiteJsonLd,
} from "@/lib/seo/json-ld-builders";

import { JsonLd } from "@/components/seo/json-ld";

export function SiteJsonLd() {
  return (
    <>
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={getWebsiteJsonLd()} />
    </>
  );
}
