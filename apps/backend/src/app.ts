import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { API_PREFIX } from "@tread-trails/shared-constants";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";
import { webhooksRouter } from "./routes/webhooks.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  app.use(cookieParser());

  // Stripe webhook requires raw body — mount before express.json()
  app.use(`${API_PREFIX}/webhooks`, webhooksRouter);

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(apiRouter);

  app.use(errorHandler);

  return app;
}
