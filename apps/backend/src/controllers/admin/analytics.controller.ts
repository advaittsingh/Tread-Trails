import type { Request, Response } from "express";

import {
  buildAnalyticsReport,
  analyticsReportToCsv,
} from "../../lib/analytics/build-report.js";
import { parseAnalyticsDateRange } from "../../lib/analytics/date-range.js";
import {
  analyticsExportFilename,
  analyticsReportToPdf,
  analyticsReportToXlsx,
} from "../../lib/analytics/export-formats.js";

function parseRange(req: Request) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") params.set(key, value);
  }
  return parseAnalyticsDateRange(params);
}

const EXPORT_FORMATS = ["csv", "xlsx", "pdf"] as const;

export async function getAnalytics(req: Request, res: Response) {
  const range = parseRange(req);
  if ("error" in range) {
    return res.status(400).json({ error: range.error });
  }

  try {
    const report = await buildAnalyticsReport(range);
    res.setHeader("Cache-Control", "private, max-age=30");
    return res.json(report);
  } catch (e) {
    console.error("[admin/analytics] failed", e);
    return res.status(500).json({ error: "Analytics failed" });
  }
}

export async function exportAnalytics(req: Request, res: Response) {
  const range = parseRange(req);
  if ("error" in range) {
    return res.status(400).json({ error: range.error });
  }

  const format = String(req.query.format ?? "csv")
    .trim()
    .toLowerCase();

  if (!EXPORT_FORMATS.includes(format as (typeof EXPORT_FORMATS)[number])) {
    return res.status(400).json({
      error: "Invalid format — use csv, xlsx, or pdf.",
    });
  }

  try {
    const report = await buildAnalyticsReport(range);
    const filename = analyticsExportFilename(report, format);

    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    if (format === "csv") {
      const csv = analyticsReportToCsv(report);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send(csv);
    }

    if (format === "xlsx") {
      const buf = analyticsReportToXlsx(report);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buf);
    }

    const pdf = await analyticsReportToPdf(report);
    res.setHeader("Content-Type", "application/pdf");
    return res.send(pdf);
  } catch (e) {
    console.error("[admin/analytics/export] failed", e);
    return res.status(500).json({ error: "Export failed" });
  }
}
