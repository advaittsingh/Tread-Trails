import { Router, raw } from "express";

import { postStripeWebhook } from "../controllers/webhooks.controller.js";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/stripe",
  raw({ type: "application/json" }),
  postStripeWebhook
);
