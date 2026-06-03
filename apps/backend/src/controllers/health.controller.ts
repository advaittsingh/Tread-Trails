import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";

export async function getHealth(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: "ok",
      service: "@tread-trails/backend",
      database: "connected",
    });
  } catch {
    return res.status(503).json({
      status: "degraded",
      service: "@tread-trails/backend",
      database: "disconnected",
    });
  }
}
