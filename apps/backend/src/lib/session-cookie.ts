import type { Response } from "express";

import { AUTH_COOKIE } from "@tread-trails/shared-constants";

import { env } from "../config/env.js";

const WEEK_MS = 60 * 60 * 24 * 7 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: WEEK_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}
