import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  analyticsReportToCsv,
  buildAnalyticsReport,
} from "@/lib/analytics/build-report";
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
    const csv = analyticsReportToCsv(report);
    const filename = `tread-trails-analytics_${report.range.from}_${report.range.to}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[admin/analytics/export] failed", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
