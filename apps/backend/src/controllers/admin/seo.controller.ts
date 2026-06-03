import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import {
  seoRouteCreateSchema,
  seoRoutePatchSchema,
  seoSettingsPatchSchema,
} from "../../lib/validators/admin-seo.js";
import {
  ensureSeoRoutes,
  ensureSeoSettings,
  getPublicSeoBundle,
  mapSeoRoute,
  mapSeoSettings,
} from "../../services/admin/seo.service.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, validationError } from "./utils.js";

export async function getSeoDashboard(_req: Request, res: Response) {
  try {
    await ensureSeoRoutes();
    const bundle = await getPublicSeoBundle();
    return res.json(bundle);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load SEO dashboard" });
  }
}

export async function patchSeoSettings(req: AuthedRequest, res: Response) {
  const parsed = seoSettingsPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const existing = await ensureSeoSettings();
    const data: Prisma.SeoSettingsUpdateInput = {};

    if (parsed.data.siteName !== undefined) data.siteName = parsed.data.siteName;
    if (parsed.data.titleTemplate !== undefined) {
      data.titleTemplate = parsed.data.titleTemplate;
    }
    if (parsed.data.defaultMetaDescription !== undefined) {
      data.defaultMetaDescription = parsed.data.defaultMetaDescription;
    }
    if (parsed.data.defaultOgImage !== undefined) {
      data.defaultOgImage = parsed.data.defaultOgImage;
    }
    if (parsed.data.defaultRobots !== undefined) {
      data.defaultRobots = parsed.data.defaultRobots;
    }
    if (parsed.data.canonicalBaseUrl !== undefined) {
      data.canonicalBaseUrl = parsed.data.canonicalBaseUrl;
    }
    if (parsed.data.organizationSchema) {
      const prev =
        existing.organizationSchema &&
        typeof existing.organizationSchema === "object"
          ? (existing.organizationSchema as Record<string, unknown>)
          : {};
      data.organizationSchema = {
        ...prev,
        ...parsed.data.organizationSchema,
      } as Prisma.InputJsonValue;
    }
    if (parsed.data.productSchema) {
      const prev =
        existing.productSchema && typeof existing.productSchema === "object"
          ? (existing.productSchema as Record<string, unknown>)
          : {};
      data.productSchema = {
        ...prev,
        ...parsed.data.productSchema,
      } as Prisma.InputJsonValue;
    }
    if (parsed.data.brandSchema) {
      const prev =
        existing.brandSchema && typeof existing.brandSchema === "object"
          ? (existing.brandSchema as Record<string, unknown>)
          : {};
      data.brandSchema = {
        ...prev,
        ...parsed.data.brandSchema,
      } as Prisma.InputJsonValue;
    }

    const row = await prisma.seoSettings.update({
      where: { id: "default" },
      data,
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "seo.settings_update",
      entity: "seo_settings",
      entityId: "default",
    });

    return res.json({ settings: mapSeoSettings(row) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}

export async function createSeoRoute(req: AuthedRequest, res: Response) {
  const parsed = seoRouteCreateSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const row = await prisma.seoRoute.create({
      data: {
        path: parsed.data.path,
        label: parsed.data.label ?? "",
        metaTitle: parsed.data.metaTitle ?? "",
        metaDescription: parsed.data.metaDescription ?? "",
        canonicalUrl: parsed.data.canonicalUrl ?? "",
        ogImageUrl: parsed.data.ogImageUrl ?? "",
        robots: parsed.data.robots ?? "",
      },
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "seo.route_create",
      entity: "seo_route",
      entityId: row.id,
      meta: { path: row.path },
    });

    return res.json({ route: mapSeoRoute(row) });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return res.status(409).json({ error: "Route path already exists" });
    }
    console.error(e);
    return res.status(500).json({ error: "Create failed" });
  }
}

export async function patchSeoRoute(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = seoRoutePatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const row = await prisma.seoRoute.update({
      where: { id },
      data: parsed.data,
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "seo.route_update",
      entity: "seo_route",
      entityId: id,
      meta: { path: row.path },
    });

    return res.json({ route: mapSeoRoute(row) });
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

export async function deleteSeoRoute(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  try {
    await prisma.seoRoute.delete({ where: { id } });
    await logAdminAction({
      adminId: adminId(req),
      action: "seo.route_delete",
      entity: "seo_route",
      entityId: id,
    });
    return res.json({ ok: true });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return res.status(404).json({ error: "Not found" });
    }
    console.error(e);
    return res.status(500).json({ error: "Delete failed" });
  }
}
