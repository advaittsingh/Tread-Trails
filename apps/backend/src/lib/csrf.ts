import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { env } from "../config/env.js";

export const CSRF_HEADER = "x-csrf-token";

function secret(): string {
  return env.jwtSecret ?? "dev-csrf-secret";
}

export function createCsrfToken(): string {
  const raw = randomBytes(24).toString("hex");
  const sig = createHmac("sha256", secret()).update(raw).digest("hex");
  return `${raw}.${sig}`;
}

export function verifyCsrfToken(token: string | undefined): boolean {
  if (!token?.trim()) return false;
  const parts = token.trim().split(".");
  if (parts.length !== 2) return false;
  const [raw, sig] = parts;
  if (!raw || !sig) return false;
  const expected = createHmac("sha256", secret()).update(raw).digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
