import { Router } from "express";

import {
  getPublicBrandCms,
  getPublicBuildCms,
  getPublicCmsPage,
  getPublicHomepage,
  getPublicVehicleCms,
} from "../controllers/cms.controller.js";

export const cmsRouter = Router();

cmsRouter.get("/homepage", getPublicHomepage);
cmsRouter.get("/pages/:slug", getPublicCmsPage);
cmsRouter.get("/brands/:slug", getPublicBrandCms);
cmsRouter.get("/vehicles/:slug", getPublicVehicleCms);
cmsRouter.get("/builds/:slug", getPublicBuildCms);
