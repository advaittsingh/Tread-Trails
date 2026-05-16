import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildAnalyticsReport } from "@/lib/analytics/build-report";
import { parseAnalyticsDateRange } from "@/lib/analytics/date-range";
import { requireAdmin } from "@/lib/auth/request-user";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const range = parseAnalyticsDateRange(new URL(req.url).searchParams);
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  try {
    const report = await buildAnalyticsReport(range);
    return NextResponse.json(report, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (e) {
    console.error("[admin/analytics] failed", e);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
