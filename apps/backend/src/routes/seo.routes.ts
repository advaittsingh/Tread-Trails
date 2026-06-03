import { Router } from "express";

import { getPublicSeo, getPublicSeoForPath } from "../controllers/seo.controller.js";

export const seoPublicRouter = Router();

seoPublicRouter.get("/", getPublicSeo);
seoPublicRouter.get("/route", getPublicSeoForPath);
