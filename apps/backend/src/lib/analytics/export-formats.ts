import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";

import type { AnalyticsReport } from "./types.js";

export function analyticsReportToXlsx(report: AnalyticsReport): Buffer {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["Tread Trails Analytics", report.range.label],
    ["From", report.range.from, "To", report.range.to],
    [],
    ["Metric", "Value"],
    ["Page views", report.totals.pageViews],
    ["Unique sessions", report.totals.uniqueSessions],
    ["Orders", report.totals.orders],
    ["Paid orders", report.totals.paidOrders],
    ["Revenue (paid)", report.totals.revenuePaid],
    ["Bookings", report.totals.bookings],
    ["Cart sessions", report.totals.cartSessions],
    ["Conversion %", report.totals.conversionPercent],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summaryRows),
    "Summary"
  );

  const dailyHeader = [
    "date",
    "revenue",
    "orders",
    "bookings",
    "pageViews",
    "sessions",
    "cartSessions",
    "paidOrders",
    "conversionRate",
  ];
  const dailyRows = report.series.revenueByDay.map(({ date }) => {
    const rev =
      report.series.revenueByDay.find((d) => d.date === date)?.revenue ?? 0;
    const ord =
      report.series.ordersByDay.find((d) => d.date === date)?.count ?? 0;
    const book =
      report.series.bookingsByDay.find((d) => d.date === date)?.count ?? 0;
    const visit = report.series.visitsByDay.find((d) => d.date === date);
    const conv = report.series.conversionByDay.find((d) => d.date === date);
    return [
      date,
      rev,
      ord,
      book,
      visit?.views ?? 0,
      visit?.sessions ?? 0,
      conv?.carts ?? 0,
      conv?.paid ?? 0,
      conv?.conversionRate ?? 0,
    ];
  });
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([dailyHeader, ...dailyRows]),
    "Daily"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["slug", "name", "units", "revenue"],
      ...report.topProducts.map((p) => [p.key, p.label, p.count, p.revenue ?? 0]),
    ]),
    "Products"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["brand", "units", "revenue"],
      ...report.topBrands.map((b) => [b.label, b.count, b.revenue ?? 0]),
    ]),
    "Brands"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["slug", "name", "bookings"],
      ...report.topVehicles.map((v) => [v.key, v.label, v.count]),
      [],
      ["status", "count"],
      ...report.bookings.byStatus.map((s) => [s.label, s.count]),
      [],
      ["service", "count"],
      ...report.bookings.byService.map((s) => [s.label, s.count]),
    ]),
    "Bookings"
  );

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function analyticsReportToPdf(report: AnalyticsReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Tread Trails Analytics", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#444");
    doc.text(`Period: ${report.range.label}`);
    doc.text(`${report.range.from} → ${report.range.to}`);
    doc.moveDown();

    doc.fillColor("#000").fontSize(12).text("Totals", { underline: true });
    doc.fontSize(10);
    const totals = [
      ["Revenue (paid)", `₹${report.totals.revenuePaid.toLocaleString("en-IN")}`],
      ["Paid orders", String(report.totals.paidOrders)],
      ["Bookings", String(report.totals.bookings)],
      ["Unique sessions", String(report.totals.uniqueSessions)],
      ["Conversion", `${report.totals.conversionPercent}%`],
    ];
    for (const [label, value] of totals) {
      doc.text(`${label}: ${value}`);
    }
    doc.moveDown();

    doc.fontSize(12).text("Revenue trend (daily)", { underline: true });
    doc.fontSize(9);
    for (const row of report.series.revenueByDay.slice(-14)) {
      doc.text(`${row.date}  ₹${row.revenue.toLocaleString("en-IN")}`);
    }
    doc.moveDown();

    doc.fontSize(12).text("Top products", { underline: true });
    doc.fontSize(9);
    for (const p of report.topProducts.slice(0, 10)) {
      doc.text(
        `${p.label} — ${p.count} units, ₹${(p.revenue ?? 0).toLocaleString("en-IN")}`
      );
    }
    doc.moveDown();

    doc.fontSize(12).text("Top brands", { underline: true });
    doc.fontSize(9);
    for (const b of report.topBrands.slice(0, 10)) {
      doc.text(
        `${b.label} — ${b.count} units, ₹${(b.revenue ?? 0).toLocaleString("en-IN")}`
      );
    }
    doc.moveDown();

    doc.fontSize(12).text("Booking analytics", { underline: true });
    doc.fontSize(9).text("By status:");
    for (const s of report.bookings.byStatus) {
      doc.text(`  ${s.label}: ${s.count}`);
    }
    doc.text("Top services:");
    for (const s of report.bookings.byService.slice(0, 8)) {
      doc.text(`  ${s.label}: ${s.count}`);
    }
    doc.text("Top vehicles:");
    for (const v of report.topVehicles.slice(0, 8)) {
      doc.text(`  ${v.label}: ${v.count}`);
    }

    doc.end();
  });
}

export function analyticsExportFilename(
  report: AnalyticsReport,
  ext: string
): string {
  return `tread-trails-analytics_${report.range.from}_${report.range.to}.${ext}`;
}
