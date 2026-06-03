import type { NextResponse } from "next/server";

import { AUTH_COOKIE } from "@/lib/constants";

const WEEK_SEC = 60 * 60 * 24 * 7;

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEEK_SEC,
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
