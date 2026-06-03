import { createHash } from "node:crypto";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip.trim()).digest("hex").slice(0, 32);
}

export function clientIpFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string {
  const fwd = headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) {
    return fwd.split(",")[0]?.trim() ?? "";
  }
  const real = headers["x-real-ip"];
  if (typeof real === "string") return real.trim();
  return "";
}
