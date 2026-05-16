import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import {
  listActivePresenceSessions,
  presenceListFingerprint,
} from "@/lib/presence/active-sessions";
import { purgeStalePresenceSessions } from "@/lib/presence/cleanup";
import { PRESENCE_TTL_MS } from "@/lib/presence/constants";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    await purgeStalePresenceSessions();

    const payload = await listActivePresenceSessions();
    const fingerprint = presenceListFingerprint(payload.sessions);
    const ifNoneMatch = req.headers.get("if-none-match");

    if (ifNoneMatch && ifNoneMatch === fingerprint) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: fingerprint,
          "Cache-Control": "private, no-cache",
        },
      });
    }

    return NextResponse.json(
      {
        ...payload,
        fingerprint,
      },
      {
        headers: {
          ETag: fingerprint,
          "Cache-Control": "private, no-cache",
          "X-Presence-TTL-Ms": String(PRESENCE_TTL_MS),
        },
      }
    );
  } catch (e) {
    console.error("[admin/presence] failed", e);
    return NextResponse.json({ error: "Presence failed" }, { status: 500 });
  }
}
