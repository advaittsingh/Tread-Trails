import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const ttlMs = 3 * 60 * 1000;
  const since = new Date(Date.now() - ttlMs);

  try {
    const sessions = await prisma.presenceSession.findMany({
      where: { lastSeenAt: { gte: since } },
      orderBy: { lastSeenAt: "desc" },
      take: 200,
      select: {
        sessionId: true,
        path: true,
        city: true,
        country: true,
        lat: true,
        lng: true,
        userAgent: true,
        lastSeenAt: true,
      },
    });

    return NextResponse.json({
      count: sessions.length,
      sessions,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Presence failed" }, { status: 500 });
  }
}
