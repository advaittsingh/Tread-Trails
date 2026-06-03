import type { Response } from "express";
import { Prisma } from "@prisma/client";
import type { ZodError } from "zod";

import type { AuthedRequest } from "../../middleware/auth.js";

export function adminId(req: AuthedRequest): string {
  return req.auth!.sub;
}

export function validationError(res: Response, error: ZodError) {
  return res.status(400).json({
    error: "Validation failed",
    details: error.flatten(),
  });
}

export function mapUniqueSlugResponse(
  e: unknown,
  res: Response,
  fallbackMessage = "Conflict"
): boolean {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002"
  ) {
    const meta = e.meta as { target?: unknown } | undefined;
    const target = meta?.target;
    const fields = Array.isArray(target)
      ? target.join(", ")
      : String(target ?? "field");
    res.status(409).json({
      error: fallbackMessage,
      detail: `Unique constraint on ${fields}`,
    });
    return true;
  }
  return false;
}

export function pagination(req: { query: Record<string, unknown> }) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(req.query.limit) || 25)
  );
  return { page, limit, skip: (page - 1) * limit };
}
