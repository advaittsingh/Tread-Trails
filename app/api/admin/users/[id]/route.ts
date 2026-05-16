import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const user = await prisma.user.findUnique({
    where: { id: context.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      preferredVehicleSlug: true,
      createdAt: true,
      wishlistProducts: { select: { productSlug: true } },
      savedVehicles: { select: { vehicleSlug: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
        },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          vehicleName: true,
          service: true,
          status: true,
          date: true,
          time: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      wishlistSlugs: user.wishlistProducts.map((w) => w.productSlug),
      savedVehicleSlugs: user.savedVehicles.map((s) => s.vehicleSlug),
      wishlistProducts: undefined,
      savedVehicles: undefined,
    },
  });
}

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const targetId = context.params.id;
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

  if (targetId === gate.auth.userId && parsed.data.role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin role" },
      { status: 400 }
    );
  }

  try {
    const prev = await prisma.user.findUnique({ where: { id: targetId } });
    if (!prev) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role: parsed.data.role },
      select: { id: true, email: true, role: true },
    });

    await logAdminAction({
      adminId: gate.auth.userId,
      action: "user.role_update",
      entity: "user",
      entityId: targetId,
      meta: { from: prev.role, to: parsed.data.role },
    });

    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
