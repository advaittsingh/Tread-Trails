import * as jose from "jose";

import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(env.jwtSecret!);
}

export async function signAuthToken(payload: JwtPayload): Promise<string> {
  return new jose.SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(token, getSecret());
  const sub = payload.sub;
  const role = payload.role;
  if (!sub || (role !== "user" && role !== "admin")) {
    throw new Error("Invalid token payload");
  }
  const iat =
    typeof payload.iat === "number" ? payload.iat : undefined;
  const exp =
    typeof payload.exp === "number" ? payload.exp : undefined;
  return { sub, role, iat, exp };
}
