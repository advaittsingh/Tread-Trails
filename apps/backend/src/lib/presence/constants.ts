export const PRESENCE_TTL_MS = 3 * 60 * 1000;

export function presenceActiveSince(now = Date.now()): Date {
  return new Date(now - PRESENCE_TTL_MS);
}
