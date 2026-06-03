import type { Request, Response } from "express";

import { prisma } from "../../lib/prisma.js";

export async function getSystem(_req: Request, res: Response) {
  let pgMs: number | null = null;
  let pgOk = false;

  const pgStarted = Date.now();
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      pgMs = Date.now() - pgStarted;
      pgOk = true;
    } catch {
      pgMs = Date.now() - pgStarted;
      pgOk = false;
    }
  }

  let recentErrors: {
    id: string;
    source: string;
    message: string;
    createdAt?: Date;
  }[] = [];

  try {
    recentErrors = await prisma.appErrorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        severity: true,
        category: true,
        source: true,
        route: true,
        message: true,
        createdAt: true,
      },
    });
  } catch {
    /* ignore */
  }

  return res.json({
    postgresConfigured: Boolean(process.env.DATABASE_URL),
    postgresOk: pgOk,
    postgresLatencyMs: pgMs,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    resendConfigured: Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL?.trim()
    ),
    razorpayConfigured: Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ),
    juspayConfigured: Boolean(
      process.env.JUSPAY_API_KEY && process.env.JUSPAY_MERCHANT_ID
    ),
    nodeEnv: process.env.NODE_ENV ?? "development",
    recentErrors,
  });
}
