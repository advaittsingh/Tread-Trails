import { getOrganizationJsonLd, getWebsiteJsonLd } from "@/lib/seo/json-ld-builders";
import { getSeoBundle } from "@/lib/server/seo";

import { JsonLd } from "@/components/seo/json-ld";

export async function SiteJsonLd() {
  const bundle = await getSeoBundle();
  const orgOverrides = bundle?.settings.organizationSchema;

  return (
    <>
      <JsonLd data={getOrganizationJsonLd(orgOverrides)} />
      <JsonLd data={getWebsiteJsonLd()} />
    </>
  );
}
