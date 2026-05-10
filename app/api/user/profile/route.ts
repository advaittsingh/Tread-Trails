import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";
import { isKnownVehicleCatalogSlug } from "@/lib/vehicle-catalog-slugs";
import { accountProfileUpdateSchema } from "@/lib/validations/profile";

export async function PATCH(req: Request) {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = accountProfileUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, preferredVehicleSlug } = parsed.data;
  if (preferredVehicleSlug !== null && !isKnownVehicleCatalogSlug(preferredVehicleSlug)) {
    return NextResponse.json({ error: "Unknown vehicle platform" }, { status: 400 });
  }

  const emailLower = email.toLowerCase();

  try {
    const conflict = await prisma.user.findFirst({
      where: {
        email: emailLower,
        NOT: { id: gate.auth.userId },
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "That email is already used on another account." },
        { status: 409 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: gate.auth.userId },
      data: {
        name,
        email: emailLower,
        phone: phone === "" ? null : phone,
        preferredVehicleSlug,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        preferredVehicleSlug: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        phone: updated.phone ?? null,
        preferredVehicleSlug: updated.preferredVehicleSlug ?? null,
      },
    });
  } catch (e) {
    console.error("[user/profile]", e);
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}
