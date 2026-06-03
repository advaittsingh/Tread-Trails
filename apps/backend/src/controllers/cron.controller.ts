import type { Request, Response } from "express";

import { purgeStalePresenceSessions } from "../lib/presence/cleanup.js";

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.authorization;
  if (auth === `Bearer ${secret}`) return true;
  const q = req.query.secret;
  return typeof q === "string" && q === secret;
}

export async function presenceCleanup(req: Request, res: Response) {
  if (!authorizeCron(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await purgeStalePresenceSessions();
    return res.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/presence-cleanup] failed", e);
    return res.status(500).json({ error: "Cleanup failed" });
  }
}
