import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { revalidateVehicleCatalog } from "@/lib/server/revalidate-vehicle-catalog";
import { prisma } from "@/lib/prisma";

type RouteCtx = { params: { id: string } };

export async function GET(_req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: context.params.id },
    select: { id: true, slug: true, name: true },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const links = await prisma.productVehicleCompatibility.findMany({
    where: { vehicleId: vehicle.id },
    include: {
      product: {
        select: { id: true, slug: true, name: true, category: true },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return NextResponse.json({
    vehicle,
    products: links.map((l) => l.product),
  });
}

const patchSchema = z.object({
  productIds: z.array(z.string().cuid()),
});

export async function PATCH(req: Request, context: RouteCtx) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: context.params.id },
    select: { id: true, slug: true },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const productIds = Array.from(new Set(parsed.data.productIds));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.productVehicleCompatibility.deleteMany({
        where: { vehicleId: vehicle.id },
      });
      if (productIds.length > 0) {
        await tx.productVehicleCompatibility.createMany({
          data: productIds.map((productId) => ({
            productId,
            vehicleId: vehicle.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "vehicle.compatibility.update",
      entity: "vehicle",
      entityId: vehicle.id,
      meta: { slug: vehicle.slug, productCount: productIds.length },
    });
    revalidateVehicleCatalog();

    return NextResponse.json({ ok: true, productCount: productIds.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
