import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { AppErrorLog } from "@/lib/models/AppErrorLog";
import { Order } from "@/lib/models/Order";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const started = Date.now();
  let mongoMs: number | null = null;
  let mongoOk = false;
  let pgMs: number | null = null;
  let pgOk = false;

  try {
    await connectDB();
    await Order.findOne().sort({ createdAt: -1 }).select("_id").lean();
    mongoMs = Date.now() - started;
    mongoOk = true;
  } catch {
    mongoMs = Date.now() - started;
    mongoOk = false;
  }

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
    await connectDB();
    const logs = await AppErrorLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    recentErrors = logs.map((l) => ({
      id: l._id.toString(),
      source: l.source,
      message: l.message,
      createdAt: l.createdAt,
    }));
  } catch {
    /* ignore */
  }

  return NextResponse.json({
    mongoOk,
    mongoLatencyMs: mongoMs,
    postgresConfigured: Boolean(process.env.DATABASE_URL),
    postgresOk: pgOk,
    postgresLatencyMs: pgMs,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    nodeEnv: process.env.NODE_ENV ?? "development",
    recentErrors,
  });
}
