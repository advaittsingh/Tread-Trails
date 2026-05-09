import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { PresenceSession } from "@/lib/models/PresenceSession";

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    await connectDB();
    const sessions = await PresenceSession.find()
      .sort({ lastSeenAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      count: sessions.length,
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        path: s.path,
        city: s.city,
        country: s.country,
        lat: s.lat,
        lng: s.lng,
        userAgent: s.userAgent,
        lastSeenAt: s.lastSeenAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Presence failed" }, { status: 500 });
  }
}
