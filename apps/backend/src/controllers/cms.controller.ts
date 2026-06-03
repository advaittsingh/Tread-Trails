import type { Request, Response } from "express";

import {
  ensureCmsPages,
  getPublicHomepageCms,
  mapCmsPage,
} from "../services/admin/cms.service.js";
import { CMS_PAGE_SLUGS, type CmsPageSlug } from "../lib/validators/admin-cms.js";
import { prisma } from "../lib/prisma.js";

export async function getPublicHomepage(_req: Request, res: Response) {
  try {
    const homepage = await getPublicHomepageCms();
    return res.json({ homepage });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load homepage" });
  }
}

export async function getPublicCmsPage(req: Request, res: Response) {
  const slug = req.params.slug as string;
  if (!CMS_PAGE_SLUGS.includes(slug as CmsPageSlug)) {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    await ensureCmsPages();
    const row = await prisma.cmsPage.findUnique({ where: { slug } });
    if (!row || !row.published) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json({ page: mapCmsPage(row) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load page" });
  }
}

export async function getPublicBrandCms(req: Request, res: Response) {
  const slug = req.params.slug as string;
  try {
    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) return res.status(404).json({ error: "Not found" });
    return res.json({
      cms: {
        bannerSrc: brand.bannerSrc,
        seoTitle: brand.seoTitle,
        seoDescription: brand.seoDescription,
        contentBlocks: brand.contentBlocks ?? [],
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load brand CMS" });
  }
}

export async function getPublicVehicleCms(req: Request, res: Response) {
  const slug = req.params.slug as string;
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { slug } });
    if (!vehicle) return res.status(404).json({ error: "Not found" });
    return res.json({
      cms: {
        seoTitle: vehicle.seoTitle,
        seoDescription: vehicle.seoDescription,
        galleryImages: vehicle.galleryImages,
        contentBlocks: vehicle.contentBlocks ?? [],
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load vehicle CMS" });
  }
}

export async function getPublicBuildCms(req: Request, res: Response) {
  const slug = req.params.slug as string;
  try {
    const build = await prisma.portfolioBuild.findUnique({ where: { slug } });
    if (!build) return res.status(404).json({ error: "Not found" });
    return res.json({
      cms: {
        contentHtml: build.contentHtml,
        videoEmbeds: build.videoEmbeds,
        seoTitle: build.seoTitle,
        seoDescription: build.seoDescription,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load build CMS" });
  }
}
