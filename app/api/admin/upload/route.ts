import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { uploadAndRegisterMedia } from "@/lib/media/upload-service";

/** Legacy upload endpoint — registers asset in media library. */
export async function POST(req: Request) {
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

  try {
    const asset = await uploadAndRegisterMedia({
      file,
      folderRaw: formData.get("folder"),
      adminId: gate.auth.userId,
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "media.upload",
      entity: "media",
      entityId: asset.id,
      meta: { folder: asset.folder, via: "legacy-upload" },
    });

    return NextResponse.json({
      url: asset.url,
      asset,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    const status = msg.includes("not configured") ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
