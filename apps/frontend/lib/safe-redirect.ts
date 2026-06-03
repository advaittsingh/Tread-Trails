/** Prevent open redirects via `?redirect=` */
export function safeInternalPath(
  raw: string | null,
  fallback = "/account"
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
