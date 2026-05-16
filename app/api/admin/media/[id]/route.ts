import { NextResponse } from "next/server";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { deleteStoredMedia } from "@/lib/media/storage";
import { toMediaAssetDTO } from "@/lib/media/upload-service";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";
import { mediaAssetPatchSchema } from "@/lib/validations/admin-media";

type RouteCtx = { params: { id: string } };

export async function PATCH(req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = mediaAssetPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const row = await prisma.mediaAsset.update({
      where: { id: context.params.id },
      data: parsed.data,
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "media.update",
      entity: "media",
      entityId: row.id,
    });

    return NextResponse.json({ asset: toMediaAssetDTO(row) });
  } catch (e) {
    if (
      e instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const row = await prisma.mediaAsset.findUnique({
    where: { id: context.params.id },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteStoredMedia(row);
    await prisma.mediaAsset.delete({ where: { id: row.id } });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "media.delete",
      entity: "media",
      entityId: row.id,
      meta: { url: row.url },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
