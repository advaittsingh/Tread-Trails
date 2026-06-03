import { prisma } from "../prisma.js";
import { presenceActiveSince } from "./constants.js";

export async function purgeStalePresenceSessions(
  now = Date.now()
): Promise<{ deleted: number; cutoff: string }> {
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
