import { Router } from "express";

import {
  getCsrf,
  getMe,
  getSession,
  postForgotPassword,
  postLogin,
  postLogout,
  postResetPassword,
  postSignup,
} from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/rate-limit.js";
import { requireCsrf } from "../middleware/csrf.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/csrf", getCsrf);

authRouter.post("/login", authRateLimiter, postLogin);
authRouter.post("/signup", authRateLimiter, postSignup);
authRouter.post("/register", authRateLimiter, postSignup);
authRouter.post("/logout", requireCsrf, postLogout);
authRouter.get("/me", optionalAuth, getMe);
authRouter.get("/session", requireAuth, getSession);
authRouter.post("/forgot-password", authRateLimiter, postForgotPassword);
authRouter.post("/reset-password", authRateLimiter, requireCsrf, postResetPassword);
