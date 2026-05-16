import { NextResponse } from "next/server";
import { z } from "zod";

import { lookupGeo } from "@/lib/geo-ip";
import { clientIpFromHeaders, hashIp } from "@/lib/ip-hash";
import { parseUserAgent } from "@/lib/presence/parse-user-agent";
import { purgeStalePresenceSessions } from "@/lib/presence/cleanup";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  path: z.string().max(512),
});

let lastCleanupAt = 0;
const CLEANUP_THROTTLE_MS = 90_000;

async function maybePurgeStale(): Promise<void> {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_THROTTLE_MS) return;
  lastCleanupAt = now;
  await purgeStalePresenceSessions(now);
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { sessionId, path } = parsed.data;
  const ip = clientIpFromHeaders(req.headers);
  const ipHash = ip ? hashIp(ip) : "";
  const ua = req.headers.get("user-agent") ?? "";
  const { deviceType, deviceLabel } = parseUserAgent(ua);
  const now = new Date();

  try {
    const doc = await prisma.presenceSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        path,
        userAgent: ua.slice(0, 512),
        deviceType,
        deviceLabel,
        ipHash,
        geoResolved: false,
        firstSeenAt: now,
        lastSeenAt: now,
      },
      update: {
        path,
        userAgent: ua.slice(0, 512),
        deviceType,
        deviceLabel,
        ipHash,
        lastSeenAt: now,
      },
      select: {
        sessionId: true,
        geoResolved: true,
      },
    });

    const needsGeo = doc && !doc.geoResolved && ip;

    if (needsGeo) {
      const geo = await lookupGeo(ip);
      if (geo.city || geo.lat != null) {
        await prisma.presenceSession.update({
          where: { sessionId },
          data: {
            city: geo.city ?? null,
            country: geo.country ?? null,
            lat: geo.lat ?? null,
            lng: geo.lng ?? null,
            geoResolved: true,
          },
        });
      }
    }

    void maybePurgeStale();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[presence] ping failed", e);
    return NextResponse.json({ error: "Ping failed" }, { status: 500 });
  }
}
