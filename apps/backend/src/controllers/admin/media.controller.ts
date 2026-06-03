import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { deleteStoredMedia } from "../../lib/media/storage.js";
import {
  toMediaAssetDTO,
  uploadAndRegisterMedia,
} from "../../lib/media/upload-service.js";
import { prisma } from "../../lib/prisma.js";
import { mediaAssetPatchSchema } from "../../lib/validators/admin-media.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, validationError } from "./utils.js";
import { multerFileToWebFile } from "../../middleware/upload.js";

export async function listMedia(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));
  const skip = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();
  const folder = String(req.query.folder ?? "").trim();
  const tag = String(req.query.tag ?? "").trim().toLowerCase();

  const where: Prisma.MediaAssetWhereInput = {};
  if (folder) where.folder = folder;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { filename: { contains: search, mode: "insensitive" } },
      { altText: { contains: search, mode: "insensitive" } },
      { url: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [rows, total, folderGroups, tagSample] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.groupBy({
        by: ["folder"],
        _count: { _all: true },
        orderBy: { folder: "asc" },
      }),
      prisma.mediaAsset.findMany({
        select: { tags: true },
        take: 200,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const tagSet = new Set<string>();
    for (const row of tagSample) {
      for (const t of row.tags) tagSet.add(t);
    }

    return res.json({
      assets: rows.map(toMediaAssetDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      folderCounts: Object.fromEntries(
        folderGroups.map((g) => [g.folder, g._count._all])
      ),
      tags: Array.from(tagSet).sort(),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load media" });
  }
}

export async function uploadMedia(req: AuthedRequest, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "Missing file" });
  }

  try {
    const asset = await uploadAndRegisterMedia({
      file: multerFileToWebFile(file),
      folderRaw: req.body.folder,
      tagsRaw: req.body.tags,
      altText: req.body.altText ?? null,
      adminId: adminId(req),
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "media.upload",
      entity: "media",
      entityId: asset.id,
      meta: { folder: asset.folder, url: asset.url },
    });

    return res.json({ asset });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    const status = msg.includes("not configured") ? 503 : 400;
    return res.status(status).json({ error: msg });
  }
}

export async function legacyUpload(req: AuthedRequest, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "Missing file" });
  }

  try {
    const asset = await uploadAndRegisterMedia({
      file: multerFileToWebFile(file),
      folderRaw: req.body.folder,
      adminId: adminId(req),
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "media.upload",
      entity: "media",
      entityId: asset.id,
      meta: { folder: asset.folder, via: "legacy-upload" },
    });

    return res.json({ url: asset.url, asset });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    const status = msg.includes("not configured") ? 503 : 400;
    return res.status(status).json({ error: msg });
  }
}

export async function patchMedia(req: AuthedRequest, res: Response) {
  const parsed = mediaAssetPatchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const row = await prisma.mediaAsset.update({
      where: { id: req.params.id as string },
      data: parsed.data,
    });

    await logAdminAction({
      adminId: adminId(req),
      action: "media.update",
      entity: "media",
      entityId: row.id,
    });

    return res.json({ asset: toMediaAssetDTO(row) });
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

export async function deleteMedia(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    await deleteStoredMedia(row);
    await prisma.mediaAsset.delete({ where: { id: row.id } });

    await logAdminAction({
      adminId: adminId(req),
      action: "media.delete",
      entity: "media",
      entityId: row.id,
      meta: { url: row.url },
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Delete failed" });
  }
}
