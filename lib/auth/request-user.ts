import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/lib/constants";

import { verifyAuthToken } from "./jwt";

export type AuthUser = {
  userId: string;
  role: "user" | "admin";
};

export async function getOptionalAuth(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyAuthToken(token);
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export async function requireAuth():
  Promise<{ auth: AuthUser } | { response: NextResponse }> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  try {
    const payload = await verifyAuthToken(token);
    return { auth: { userId: payload.sub, role: payload.role } };
  } catch {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

export async function requireAdmin():
  Promise<{ auth: AuthUser } | { response: NextResponse }> {
  const result = await requireAuth();
  if ("response" in result) return result;
  if (result.auth.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
