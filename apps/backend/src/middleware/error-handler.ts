import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { CheckoutHttpError } from "../lib/order/checkout-resolution.js";
import { AuthHttpError } from "../services/auth.service.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  if (err instanceof CheckoutHttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof AuthHttpError) {
    return res.status(err.status).json(
      err.details ? { error: err.message, details: err.details } : { error: err.message }
    );
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return res.status(500).json({ error: message });
}
