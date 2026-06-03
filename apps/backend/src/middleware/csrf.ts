import type { NextFunction, Request, Response } from "express";

import { CSRF_HEADER, verifyCsrfToken } from "../lib/csrf.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const token =
    req.headers[CSRF_HEADER] ??
    req.headers[CSRF_HEADER.toUpperCase()] ??
    req.get(CSRF_HEADER);

  if (!verifyCsrfToken(typeof token === "string" ? token : undefined)) {
    return res.status(403).json({ error: "Invalid or missing CSRF token" });
  }

  return next();
}
