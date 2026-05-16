import { NextResponse } from "next/server";

import { purgeStalePresenceSessions } from "@/lib/presence/cleanup";

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const q = new URL(req.url).searchParams.get("secret");
  return q === secret;
}

/**
 * Scheduled stale-session purge (Vercel Cron every 2 minutes).
 * Set CRON_SECRET in env and configure vercel.json crons.
 */
export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgeStalePresenceSessions();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/presence-cleanup] failed", e);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
