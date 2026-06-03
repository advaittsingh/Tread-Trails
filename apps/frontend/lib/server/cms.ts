import type { Build, Product } from "@/data/types";

import { apiFetchJson } from "@/services/api/server";

export type CmsHero = {
  eyebrow?: string;
  title?: string;
  titleAccent?: string;
  description?: string;
  imageUrl?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export type CmsContentBlock = {
  id: string;
  type: "text" | "image" | "cta" | "html";
  title?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type CmsPageContent = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  hero: CmsHero;
  sections: CmsContentBlock[];
  seoTitle: string;
  seoDescription: string;
};

export type HomepageCms = {
  hero: CmsHero;
  featuredProductSlugs: string[];
  featuredBuildSlugs: string[];
  sectionOrder: string[];
  featuredProducts: Product[];
  featuredBuilds: Build[];
};

export async function getHomepageCms(): Promise<HomepageCms | null> {
  try {
    const data = await apiFetchJson<{ homepage?: HomepageCms }>("/api/cms/homepage", {
      revalidate: 60,
      tags: ["cms-homepage"],
    });
    return data.homepage ?? null;
  } catch {
    return null;
  }
}

export async function getCmsPage(slug: string): Promise<CmsPageContent | null> {
  try {
    const data = await apiFetchJson<{ page?: CmsPageContent }>(
      `/api/cms/pages/${encodeURIComponent(slug)}`,
      { revalidate: 60, tags: [`cms-page-${slug}`] }
    );
    return data.page ?? null;
  } catch {
    return null;
  }
}

export async function getBrandCms(slug: string) {
  try {
    const data = await apiFetchJson<{
      cms?: {
        bannerSrc: string;
        seoTitle: string;
        seoDescription: string;
        contentBlocks: CmsContentBlock[];
      };
    }>(`/api/cms/brands/${encodeURIComponent(slug)}`, {
      revalidate: 60,
      tags: [`cms-brand-${slug}`],
    });
    return data.cms ?? null;
  } catch {
    return null;
  }
}

export async function getVehicleCms(slug: string) {
  try {
    const data = await apiFetchJson<{
      cms?: {
        seoTitle: string;
        seoDescription: string;
        galleryImages: string[];
        contentBlocks: CmsContentBlock[];
      };
    }>(`/api/cms/vehicles/${encodeURIComponent(slug)}`, {
      revalidate: 60,
      tags: [`cms-vehicle-${slug}`],
    });
    return data.cms ?? null;
  } catch {
    return null;
  }
}

export async function getBuildCms(slug: string) {
  try {
    const data = await apiFetchJson<{
      cms?: {
        contentHtml: string;
        videoEmbeds: string[];
        seoTitle: string;
        seoDescription: string;
      };
    }>(`/api/cms/builds/${encodeURIComponent(slug)}`, {
      revalidate: 60,
      tags: [`cms-build-${slug}`],
    });
    return data.cms ?? null;
  } catch {
    return null;
  }
}
