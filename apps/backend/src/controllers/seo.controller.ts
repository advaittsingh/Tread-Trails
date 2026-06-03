import type { Request, Response } from "express";

import { getPublicSeoBundle, resolveRouteSeo } from "../services/admin/seo.service.js";

export async function getPublicSeo(_req: Request, res: Response) {
  try {
    const bundle = await getPublicSeoBundle();
    return res.json(bundle);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load SEO config" });
  }
}

export async function getPublicSeoForPath(req: Request, res: Response) {
  const path = String(req.query.path ?? "/").trim() || "/";
  try {
    const bundle = await getPublicSeoBundle();
    const resolved = resolveRouteSeo(path, bundle.routes, bundle.settings);
    return res.json({ path, ...resolved, settings: bundle.settings });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load route SEO" });
  }
}
