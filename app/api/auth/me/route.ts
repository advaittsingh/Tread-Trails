import { NextResponse } from "next/server";

import { getOptionalAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getOptionalAuth();
  if (!auth) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? null,
        role: user.role,
        preferredVehicleSlug: user.preferredVehicleSlug ?? null,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}
