import { NextResponse } from "next/server";
import { z } from "zod";

import { lookupGeo } from "@/lib/geo-ip";
import { clientIpFromHeaders, hashIp } from "@/lib/ip-hash";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  path: z.string().max(512),
});

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

  try {
    const doc = await prisma.presenceSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        path,
        userAgent: ua,
        ipHash,
        geoResolved: false,
        lastSeenAt: new Date(),
      },
      update: {
        path,
        userAgent: ua,
        ipHash,
        lastSeenAt: new Date(),
      },
      select: {
        sessionId: true,
        geoResolved: true,
      },
    });

    const needsGeo =
      doc &&
      !doc.geoResolved &&
      ip;

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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ping failed" }, { status: 500 });
  }
}
