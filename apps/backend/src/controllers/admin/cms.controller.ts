import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { extractChange } from "../../lib/admin/audit-diff.js";
import { prismaPortfolioBuildToBuild } from "../../lib/catalog/map-portfolio-build.js";
import {
  CMS_PAGE_SLUGS,
  cmsBrandPatchSchema,
  cmsBuildPatchSchema,
  cmsHomepagePatchSchema,
  cmsPagePatchSchema,
  cmsVehiclePatchSchema,
  type CmsPageSlug,
} from "../../lib/validators/admin-cms.js";
import {
  ensureCmsHomepage,
  ensureCmsPages,
  listCmsPickerOptions,
  mapCmsHomepage,
  mapCmsPage,
} from "../../services/admin/cms.service.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, validationError } from "./utils.js";

export async function getAdminHomepageCms(_req: Request, res: Response) {
  try {
    const row = await ensureCmsHomepage();
    return res.json({ homepage: mapCmsHomepage(row) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load homepage CMS" });
  }
}

export async function patchAdminHomepageCms(req: AuthedRequest, res: Response) {
  const parsed = cmsHomepagePatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const existing = await ensureCmsHomepage();
    const data: Prisma.CmsHomepageUpdateInput = {};

    if (parsed.data.hero) {
      const prev =
        existing.hero && typeof existing.hero === "object"
          ? (existing.hero as Record<string, unknown>)
          : {};
      data.hero = { ...prev, ...parsed.data.hero } as Prisma.InputJsonValue;
    }
    if (parsed.data.featuredProductSlugs) {
      data.featuredProductSlugs = parsed.data.featuredProductSlugs;
      await prisma.$transaction(async (tx) => {
        await tx.product.updateMany({ data: { homeFeaturedRank: null } });
        for (let i = 0; i < parsed.data.featuredProductSlugs!.length; i++) {
          await tx.product.updateMany({
            where: { slug: parsed.data.featuredProductSlugs![i] },
            data: { homeFeaturedRank: i },
          });
        }
      });
    }
    if (parsed.data.featuredBuildSlugs) {
      data.featuredBuildSlugs = parsed.data.featuredBuildSlugs;
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < parsed.data.featuredBuildSlugs!.length; i++) {
          await tx.portfolioBuild.updateMany({
            where: { slug: parsed.data.featuredBuildSlugs![i] },
            data: { homeSpotlightRank: i },
          });
        }
      });
    }
    if (parsed.data.sectionOrder) data.sectionOrder = parsed.data.sectionOrder;
    if (parsed.data.sectionConfig) {
      data.sectionConfig = parsed.data.sectionConfig as Prisma.InputJsonValue;
    }

    const row = await prisma.cmsHomepage.update({
      where: { id: "default" },
      data,
    });

    const change = extractChange(
      mapCmsHomepage(existing) as unknown as Record<string, unknown>,
      parsed.data as Record<string, unknown>
    );

    await logAdminAction({
      adminId: adminId(req),
      action: "cms.homepage_update",
      entity: "cms",
      entityId: "homepage",
      previousValue: change?.previousValue ?? null,
      newValue: change?.newValue ?? null,
    });

    return res.json({ homepage: mapCmsHomepage(row) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function listAdminCmsPages(_req: Request, res: Response) {
  try {
    await ensureCmsPages();
    const rows = await prisma.cmsPage.findMany({
      orderBy: { slug: "asc" },
    });
    return res.json({ pages: rows.map(mapCmsPage) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load pages" });
  }
}

export async function getAdminCmsPage(req: Request, res: Response) {
  const slug = req.params.slug as string;
  if (!CMS_PAGE_SLUGS.includes(slug as CmsPageSlug)) {
    return res.status(404).json({ error: "Unknown page slug" });
  }

  try {
    await ensureCmsPages();
    const row = await prisma.cmsPage.findUniqueOrThrow({ where: { slug } });
    return res.json({ page: mapCmsPage(row) });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Failed to load page" });
  }
}

export async function patchAdminCmsPage(req: AuthedRequest, res: Response) {
  const slug = req.params.slug as string;
  if (!CMS_PAGE_SLUGS.includes(slug as CmsPageSlug)) {
    return res.status(404).json({ error: "Unknown page slug" });
  }

  const parsed = cmsPagePatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    await ensureCmsPages();
    const existing = await prisma.cmsPage.findUniqueOrThrow({ where: { slug } });
    const data: Prisma.CmsPageUpdateInput = { ...parsed.data };

    if (parsed.data.hero) {
      const prev =
        existing.hero && typeof existing.hero === "object"
          ? (existing.hero as Record<string, unknown>)
          : {};
      data.hero = { ...prev, ...parsed.data.hero } as Prisma.InputJsonValue;
    }
    if (parsed.data.sections) {
      data.sections = parsed.data.sections as Prisma.InputJsonValue;
    }

    const row = await prisma.cmsPage.update({ where: { slug }, data });

    const change = extractChange(
      mapCmsPage(existing) as unknown as Record<string, unknown>,
      parsed.data as Record<string, unknown>
    );

    await logAdminAction({
      adminId: adminId(req),
      action: "cms.page_update",
      entity: "cms",
      entityId: row.id,
      previousValue: change?.previousValue ?? null,
      newValue: change?.newValue ?? null,
      meta: { slug },
    });

    return res.json({ page: mapCmsPage(row) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function getAdminBrandCms(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) return res.status(404).json({ error: "Not found" });
    return res.json({
      brand: {
        id: brand.id,
        slug: brand.slug,
        name: brand.name,
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

export async function patchAdminBrandCms(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = cmsBrandPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const data: Prisma.BrandUpdateInput = {};
    if (parsed.data.bannerSrc !== undefined) data.bannerSrc = parsed.data.bannerSrc;
    if (parsed.data.seoTitle !== undefined) data.seoTitle = parsed.data.seoTitle;
    if (parsed.data.seoDescription !== undefined) {
      data.seoDescription = parsed.data.seoDescription;
    }
    if (parsed.data.contentBlocks) {
      data.contentBlocks = parsed.data.contentBlocks as Prisma.InputJsonValue;
    }

    const brand = await prisma.brand.update({ where: { id }, data });

    const prevSnapshot = {
      bannerSrc: existing.bannerSrc,
      seoTitle: existing.seoTitle,
      seoDescription: existing.seoDescription,
      contentBlocks: existing.contentBlocks ?? [],
    };
    const change = extractChange(
      prevSnapshot as Record<string, unknown>,
      parsed.data as Record<string, unknown>
    );

    await logAdminAction({
      adminId: adminId(req),
      action: "cms.brand_update",
      entity: "cms",
      entityId: id,
      previousValue: change?.previousValue ?? null,
      newValue: change?.newValue ?? null,
    });

    return res.json({
      brand: {
        id: brand.id,
        slug: brand.slug,
        name: brand.name,
        bannerSrc: brand.bannerSrc,
        seoTitle: brand.seoTitle,
        seoDescription: brand.seoDescription,
        contentBlocks: brand.contentBlocks ?? [],
      },
    });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function getAdminVehicleCms(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return res.status(404).json({ error: "Not found" });
    return res.json({
      vehicle: {
        id: vehicle.id,
        slug: vehicle.slug,
        name: vehicle.name,
        description: vehicle.description,
        heroImage: vehicle.heroImage,
        thumbnail: vehicle.thumbnail,
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

export async function patchAdminVehicleCms(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = cmsVehiclePatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const data: Prisma.VehicleUpdateInput = { ...parsed.data };
    if (parsed.data.contentBlocks) {
      data.contentBlocks = parsed.data.contentBlocks as Prisma.InputJsonValue;
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data });

    const change = extractChange(
      {
        description: existing.description,
        heroImage: existing.heroImage,
        thumbnail: existing.thumbnail,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
        galleryImages: existing.galleryImages,
        contentBlocks: existing.contentBlocks ?? [],
      },
      parsed.data as Record<string, unknown>
    );

    await logAdminAction({
      adminId: adminId(req),
      action: "cms.vehicle_update",
      entity: "cms",
      entityId: id,
      previousValue: change?.previousValue ?? null,
      newValue: change?.newValue ?? null,
    });

    return res.json({
      vehicle: {
        id: vehicle.id,
        slug: vehicle.slug,
        name: vehicle.name,
        description: vehicle.description,
        heroImage: vehicle.heroImage,
        thumbnail: vehicle.thumbnail,
        seoTitle: vehicle.seoTitle,
        seoDescription: vehicle.seoDescription,
        galleryImages: vehicle.galleryImages,
        contentBlocks: vehicle.contentBlocks ?? [],
      },
    });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function getAdminBuildCms(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const row = await prisma.portfolioBuild.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({
      build: {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        contentHtml: row.contentHtml,
        gallery: row.gallery,
        videoEmbeds: row.videoEmbeds,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        homeSpotlightRank: row.homeSpotlightRank,
        catalog: prismaPortfolioBuildToBuild(row),
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load build CMS" });
  }
}

export async function patchAdminBuildCms(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = cmsBuildPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const existing = await prisma.portfolioBuild.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const row = await prisma.portfolioBuild.update({
      where: { id },
      data: parsed.data,
    });

    const change = extractChange(
      {
        title: existing.title,
        description: existing.description,
        contentHtml: existing.contentHtml,
        gallery: existing.gallery,
        videoEmbeds: existing.videoEmbeds,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
        homeSpotlightRank: existing.homeSpotlightRank,
      },
      parsed.data as Record<string, unknown>
    );

    await logAdminAction({
      adminId: adminId(req),
      action: "cms.build_update",
      entity: "cms",
      entityId: id,
      previousValue: change?.previousValue ?? null,
      newValue: change?.newValue ?? null,
    });

    return res.json({
      build: {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        contentHtml: row.contentHtml,
        gallery: row.gallery,
        videoEmbeds: row.videoEmbeds,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        homeSpotlightRank: row.homeSpotlightRank,
        catalog: prismaPortfolioBuildToBuild(row),
      },
    });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function getCmsPickerOptions(_req: Request, res: Response) {
  try {
    const options = await listCmsPickerOptions();
    return res.json(options);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load options" });
  }
}
