import type { NextFunction, Request, Response } from "express";

import type { Role } from "@tread-trails/shared-constants";
import { AUTH_COOKIE } from "@tread-trails/shared-constants";

import { verifyAuthToken } from "../lib/jwt.js";
import {
  AuthSessionError,
  resolveAuthUser,
} from "../lib/auth-session.js";

export type AuthPayload = {
  sub: string;
  role: Role;
  iat?: number;
  exp?: number;
};

import type { UploadedFile } from "./upload.js";

export type AuthedRequest = Request & {
  auth?: AuthPayload;
  file?: UploadedFile;
};

function getToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return req.cookies?.[AUTH_COOKIE];
}

export async function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  const token = getToken(req);
  if (!token) return next();

  try {
    req.auth = await verifyAuthToken(token);
  } catch {
    /* ignore invalid token */
  }
  next();
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = await verifyAuthToken(token);
    const user = await resolveAuthUser(payload.sub, payload.iat);
    req.auth = {
      sub: user.id,
      role: user.role,
      iat: payload.iat,
      exp: payload.exp,
    };
    return next();
  } catch (e) {
    if (e instanceof AuthSessionError) {
      return res.status(e.status).json({ error: e.message });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}
