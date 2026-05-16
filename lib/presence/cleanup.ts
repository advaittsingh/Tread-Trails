import { presenceActiveSince } from "@/lib/presence/constants";
import { prisma } from "@/lib/prisma";

export type PresenceCleanupResult = {
  deleted: number;
  cutoff: string;
};

/** Deletes presence rows older than the live TTL. */
export async function purgeStalePresenceSessions(
  now = Date.now()
): Promise<PresenceCleanupResult> {
  const cutoff = presenceActiveSince(now);
  const result = await prisma.presenceSession.deleteMany({
    where: { lastSeenAt: { lt: cutoff } },
  });

  if (result.count > 0) {
    console.info("[presence] purged stale sessions", {
      deleted: result.count,
      cutoff: cutoff.toISOString(),
    });
  }

  return { deleted: result.count, cutoff: cutoff.toISOString() };
}
