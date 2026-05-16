import type { PresenceSession } from "@prisma/client";

import { PRESENCE_TTL_MS, presenceActiveSince } from "@/lib/presence/constants";
import { prisma } from "@/lib/prisma";

export type PresenceSessionDto = {
  sessionId: string;
  path: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  deviceType: string | null;
  deviceLabel: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  /** Seconds since first heartbeat. */
  sessionDurationSec: number;
  /** Seconds since last heartbeat (0 = just now). */
  idleSec: number;
};

function mapRow(row: PresenceSession, now: number): PresenceSessionDto {
  const first = row.firstSeenAt.getTime();
  const last = row.lastSeenAt.getTime();
  return {
    sessionId: row.sessionId,
    path: row.path,
    city: row.city,
    country: row.country,
    lat: row.lat,
    lng: row.lng,
    deviceType: row.deviceType,
    deviceLabel: row.deviceLabel,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    sessionDurationSec: Math.max(0, Math.floor((now - first) / 1000)),
    idleSec: Math.max(0, Math.floor((now - last) / 1000)),
  };
}

export async function listActivePresenceSessions(opts?: {
  limit?: number;
  now?: number;
}): Promise<{
  sessions: PresenceSessionDto[];
  count: number;
  ttlMs: number;
  serverTime: string;
}> {
  const now = opts?.now ?? Date.now();
  const since = presenceActiveSince(now);
  const limit = opts?.limit ?? 200;

  const rows = await prisma.presenceSession.findMany({
    where: { lastSeenAt: { gte: since } },
    orderBy: { lastSeenAt: "desc" },
    take: limit,
  });

  const sessions = rows.map((r) => mapRow(r, now));

  return {
    sessions,
    count: sessions.length,
    ttlMs: PRESENCE_TTL_MS,
    serverTime: new Date(now).toISOString(),
  };
}

/** Lightweight fingerprint for admin polling (304 support). */
export function presenceListFingerprint(
  sessions: PresenceSessionDto[]
): string {
  if (sessions.length === 0) return "empty";
  const head = sessions
    .slice(0, 20)
    .map((s) => `${s.sessionId}:${s.lastSeenAt}:${s.path}`)
    .join("|");
  return `${sessions.length}:${head}`;
}
