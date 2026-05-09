import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { lookupGeo } from "@/lib/geo-ip";
import { clientIpFromHeaders, hashIp } from "@/lib/ip-hash";
import { PresenceSession } from "@/lib/models/PresenceSession";

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
    await connectDB();
    const doc = await PresenceSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          path,
          userAgent: ua,
          ipHash,
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          geoResolved: false,
        },
      },
      { upsert: true, new: true }
    ).lean();

    const needsGeo =
      doc &&
      !(doc as { geoResolved?: boolean }).geoResolved &&
      ip;

    if (needsGeo) {
      const geo = await lookupGeo(ip);
      if (geo.city || geo.lat != null) {
        await PresenceSession.updateOne(
          { sessionId },
          {
            $set: {
              city: geo.city,
              country: geo.country,
              lat: geo.lat,
              lng: geo.lng,
              geoResolved: true,
            },
          }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ping failed" }, { status: 500 });
  }
}
