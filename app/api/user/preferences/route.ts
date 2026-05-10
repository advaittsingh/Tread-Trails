import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";
import { isKnownVehicleCatalogSlug } from "@/lib/vehicle-catalog-slugs";

const patchSchema = z.object({
  preferredVehicleSlug: z.union([z.string().min(1).max(120), z.null()]),
});

export async function PATCH(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const next = parsed.data.preferredVehicleSlug;
  if (next !== null && !isKnownVehicleCatalogSlug(next)) {
    return NextResponse.json({ error: "Unknown vehicle slug" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: gate.auth.userId },
      data: { preferredVehicleSlug: next },
    });
    return NextResponse.json({ ok: true, preferredVehicleSlug: next });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not update preferences" }, { status: 500 });
  }
}
