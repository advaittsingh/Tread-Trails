import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

/** Admin users available for lead assignment. */
export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json({ assignees: admins });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load assignees" }, { status: 500 });
  }
}
