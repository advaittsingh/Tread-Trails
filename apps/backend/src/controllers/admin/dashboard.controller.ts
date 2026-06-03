import type { Request, Response } from "express";

import { buildAdminDashboard } from "../../services/admin/dashboard.service.js";

export async function getDashboard(_req: Request, res: Response) {
  try {
    const payload = await buildAdminDashboard();
    res.setHeader("Cache-Control", "private, max-age=20");
    return res.json(payload);
  } catch (e) {
    console.error("[admin/dashboard] failed", e);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
}
