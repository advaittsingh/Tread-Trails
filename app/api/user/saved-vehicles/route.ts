import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";
import { isKnownVehicleCatalogSlug } from "@/lib/vehicle-catalog-slugs";

const putSchema = z.object({
  slugs: z.array(z.string().min(1).max(120)).max(48),
});

async function listSlugsForUser(userId: string): Promise<string[]> {
  const rows = await prisma.userSavedVehicle.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { vehicleSlug: true },
  });
  return rows.map((r) => r.vehicleSlug);
}

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  try {
    const slugs = await listSlugsForUser(gate.auth.userId);
    return NextResponse.json({ slugs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load saved vehicles" }, { status: 500 });
  }
}

/** Toggle membership for one catalog slug; returns authoritative list */
export async function POST(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z.object({ vehicleSlug: z.string().min(1).max(120) }).safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { vehicleSlug } = parsed.data;
  if (!isKnownVehicleCatalogSlug(vehicleSlug)) {
    return NextResponse.json({ error: "Unknown vehicle slug" }, { status: 400 });
  }

  try {
    const existing = await prisma.userSavedVehicle.findUnique({
      where: {
        userId_vehicleSlug: {
          userId: gate.auth.userId,
          vehicleSlug,
        },
      },
    });

    if (existing) {
      await prisma.userSavedVehicle.delete({ where: { id: existing.id } });
    } else {
      await prisma.userSavedVehicle.create({
        data: {
          userId: gate.auth.userId,
          vehicleSlug,
        },
      });
    }

    const slugs = await listSlugsForUser(gate.auth.userId);
    return NextResponse.json({ slugs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not update saved vehicles" }, { status: 500 });
  }
}

/** Replace entire saved list (used after merging device + server lists on login) */
export async function PUT(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const unique = Array.from(new Set(parsed.data.slugs));
  if (unique.some((s) => !isKnownVehicleCatalogSlug(s))) {
    return NextResponse.json({ error: "Unknown vehicle slug in list" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userSavedVehicle.deleteMany({ where: { userId: gate.auth.userId } });
      if (unique.length > 0) {
        await tx.userSavedVehicle.createMany({
          data: unique.map((vehicleSlug) => ({
            userId: gate.auth.userId,
            vehicleSlug,
          })),
        });
      }
    });

    const slugs = await listSlugsForUser(gate.auth.userId);
    return NextResponse.json({ slugs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not replace saved vehicles" }, { status: 500 });
  }
}
