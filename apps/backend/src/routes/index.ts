import { Router } from "express";

import { API_PREFIX } from "@tread-trails/shared-constants";

import { adminRouter } from "./admin/index.js";
import { authRouter } from "./auth.routes.js";
import { catalogRouter } from "./catalog.routes.js";
import { cmsRouter } from "./cms.routes.js";
import { seoPublicRouter } from "./seo.routes.js";
import { cronRouter } from "./cron.routes.js";
import { healthRouter } from "./health.routes.js";
import { storefrontRouter } from "./storefront.routes.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(`${API_PREFIX}/auth`, authRouter);
apiRouter.use(API_PREFIX, catalogRouter);
apiRouter.use(`${API_PREFIX}/cms`, cmsRouter);
apiRouter.use(`${API_PREFIX}/seo`, seoPublicRouter);
apiRouter.use(API_PREFIX, storefrontRouter);
apiRouter.use(`${API_PREFIX}/cron`, cronRouter);
apiRouter.use(`${API_PREFIX}/admin`, adminRouter);

