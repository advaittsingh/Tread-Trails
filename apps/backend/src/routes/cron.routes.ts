import { Router } from "express";

import { presenceCleanup } from "../controllers/cron.controller.js";

export const cronRouter = Router();

cronRouter.get("/presence-cleanup", presenceCleanup);
cronRouter.post("/presence-cleanup", presenceCleanup);
