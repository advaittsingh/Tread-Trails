import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let pgMs: number | null = null;
  let pgOk = false;

  const pgStarted = Date.now();
  if (process.env.DATABASE_URL) {
    try {
      // lightweight probe (no schema assumption)
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
    const logs = await prisma.appErrorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, source: true, message: true, createdAt: true },
    });
    recentErrors = logs;
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    postgresConfigured: Boolean(process.env.DATABASE_URL),
    postgresOk: pgOk,
    postgresLatencyMs: pgMs,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    resendConfigured: Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL?.trim()
    ),
    nodeEnv: process.env.NODE_ENV ?? "development",
    recentErrors,
  });
}
