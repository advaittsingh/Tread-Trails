import type { Request, Response } from "express";

import {
  listActivePresenceSessions,
  presenceListFingerprint,
} from "../../lib/presence/active-sessions.js";
import { purgeStalePresenceSessions } from "../../lib/presence/cleanup.js";
import { PRESENCE_TTL_MS } from "../../lib/presence/constants.js";

export async function getPresence(req: Request, res: Response) {
  try {
    await purgeStalePresenceSessions();

    const payload = await listActivePresenceSessions();
    const fingerprint = presenceListFingerprint(payload.sessions);
    const ifNoneMatch = req.headers["if-none-match"];

    if (ifNoneMatch && ifNoneMatch === fingerprint) {
      res.setHeader("ETag", fingerprint);
      res.setHeader("Cache-Control", "private, no-cache");
      return res.status(304).end();
    }

    res.setHeader("ETag", fingerprint);
    res.setHeader("Cache-Control", "private, no-cache");
    res.setHeader("X-Presence-TTL-Ms", String(PRESENCE_TTL_MS));
    return res.json({ ...payload, fingerprint });
  } catch (e) {
    console.error("[admin/presence] failed", e);
    return res.status(500).json({ error: "Presence failed" });
  }
}
