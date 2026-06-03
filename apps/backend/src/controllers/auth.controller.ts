import type { Request, Response } from "express";
import type { ZodError } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { AuthHttpError, authService } from "../services/auth.service.js";
import { createCsrfToken } from "../lib/csrf.js";
import { clearAuthCookie, setAuthCookie } from "../lib/session-cookie.js";
import {
  forgotPasswordRequestSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "../validators/auth.validators.js";

function parseJsonBody(req: Request): unknown {
  return req.body;
}

function validationError(res: Response, error: ZodError) {
  return res.status(400).json({
    error: "Validation failed",
    details: error.flatten(),
  });
}

export async function postLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) return validationError(res, parsed.error as ZodError);

  try {
    const { user, token } = await authService.login(
      parsed.data.email,
      parsed.data.password
    );
    setAuthCookie(res, token);
    return res.json({ user });
  } catch (e) {
    if (e instanceof AuthHttpError) {
      return res.status(e.status).json(
        e.details ? { error: e.message, details: e.details } : { error: e.message }
      );
    }
    throw e;
  }
}

export async function postSignup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) return validationError(res, parsed.error as ZodError);

  try {
    const { user, token } = await authService.signup(
      parsed.data.name,
      parsed.data.email,
      parsed.data.password
    );
    setAuthCookie(res, token);
    return res.json({ user });
  } catch (e) {
    if (e instanceof AuthHttpError) {
      return res.status(e.status).json({ error: e.message });
    }
    throw e;
  }
}

export async function postLogout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.json({ ok: true });
}

export async function getCsrf(_req: Request, res: Response) {
  const csrfToken = createCsrfToken();
  res.setHeader("Cache-Control", "no-store");
  return res.json({ csrfToken });
}

export async function getSession(req: AuthedRequest, res: Response) {
  if (!req.auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const expSec = req.auth.exp;
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresInSec = expSec != null ? Math.max(0, expSec - nowSec) : null;

  try {
    const user = await authService.getMe(req.auth.sub);
    return res.json({
      user,
      session: {
        expiresAt:
          expSec != null ? new Date(expSec * 1000).toISOString() : null,
        expiresInSec,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load session" });
  }
}

export async function getMe(req: AuthedRequest, res: Response) {
  if (!req.auth) {
    return res.json({ user: null });
  }

  try {
    const user = await authService.getMe(req.auth.sub);
    return res.json({ user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load user" });
  }
}

export async function postForgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordRequestSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) return validationError(res, parsed.error as ZodError);

  const result = await authService.forgotPassword(parsed.data.email);
  return res.json(result);
}

export async function postResetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(parseJsonBody(req));
  if (!parsed.success) return validationError(res, parsed.error as ZodError);

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return res.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthHttpError) {
      return res.status(e.status).json({ error: e.message });
    }
    throw e;
  }
}
