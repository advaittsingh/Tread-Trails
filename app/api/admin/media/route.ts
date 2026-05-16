import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { toMediaAssetDTO, uploadAndRegisterMedia } from "@/lib/media/upload-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(60, Math.max(1, Number(searchParams.get("limit")) || 24));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim();
  const folder = searchParams.get("folder")?.trim();
  const tag = searchParams.get("tag")?.trim().toLowerCase();

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

    return NextResponse.json({
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
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const tagsRaw = formData.get("tags");
  const altRaw = formData.get("altText");

  try {
    const asset = await uploadAndRegisterMedia({
      file,
      folderRaw: formData.get("folder"),
      tagsRaw: typeof tagsRaw === "string" ? tagsRaw : undefined,
      altText: typeof altRaw === "string" ? altRaw : null,
      adminId: gate.auth.userId,
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "media.upload",
      entity: "media",
      entityId: asset.id,
      meta: { folder: asset.folder, url: asset.url },
    });

    return NextResponse.json({ asset });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    const status = msg.includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
