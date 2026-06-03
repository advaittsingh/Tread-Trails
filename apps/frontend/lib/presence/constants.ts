/** Sessions without a heartbeat for this long are not counted as live. */
export const PRESENCE_TTL_MS = 3 * 60 * 1000;

/** Client heartbeat interval — must stay well under TTL. */
export const PRESENCE_HEARTBEAT_MS = 60 * 1000;

/** Admin live map poll when tab is visible. */
export const PRESENCE_ADMIN_POLL_VISIBLE_MS = 10_000;

/** Admin poll when tab is in background. */
export const PRESENCE_ADMIN_POLL_HIDDEN_MS = 30_000;

export function presenceActiveSince(now = Date.now()): Date {
  return new Date(now - PRESENCE_TTL_MS);
}
