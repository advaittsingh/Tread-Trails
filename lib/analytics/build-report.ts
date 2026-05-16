import type { AnalyticsDateRange } from "@/lib/analytics/date-range";
import { fillDailySeries } from "@/lib/analytics/date-range";
import type {
  AnalyticsReport,
  DailyConversion,
  DailyCount,
  DailyRevenue,
  DailyViews,
  RankedRow,
} from "@/lib/analytics/types";
import { prisma } from "@/lib/prisma";

function num(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  return Number(v) || 0;
}

export async function buildAnalyticsReport(
  range: AnalyticsDateRange
): Promise<AnalyticsReport> {
  const { start, endExclusive, dayKeys } = range;
  const abandonedCutoff = new Date(Date.now() - 30 * 60 * 1000);

  const [
    revenueRows,
    ordersRows,
    paidOrdersRows,
    bookingsRows,
    trafficRows,
    cartDayRows,
    topPagesRows,
    topProductRows,
    topCartRows,
    topVehicleRows,
    pageViewTotal,
    sessionTotal,
    orderTotal,
    paidOrderTotal,
    revenueTotal,
    bookingTotal,
    cartSessionTotal,
    abandonedTotal,
  ] = await Promise.all([
    prisma.$queryRaw<{ date: string; revenue: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             COALESCE(SUM(total), 0)::int AS revenue
      FROM "Order"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
        AND status = 'paid'
      GROUP BY 1
      ORDER BY 1`,

    prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM "Order"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
      GROUP BY 1
      ORDER BY 1`,

    prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM "Order"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
        AND status = 'paid'
      GROUP BY 1
      ORDER BY 1`,

    prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS count
      FROM "Booking"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
      GROUP BY 1
      ORDER BY 1`,

    prisma.$queryRaw<{ date: string; views: number; sessions: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS views,
             COUNT(DISTINCT "sessionId")::int AS sessions
      FROM "PageHit"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
      GROUP BY 1
      ORDER BY 1`,

    prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT to_char("updatedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
             COUNT(DISTINCT "sessionId")::int AS count
      FROM "CartTelemetry"
      WHERE "updatedAt" >= ${start} AND "updatedAt" < ${endExclusive}
        AND "itemCount" > 0
      GROUP BY 1
      ORDER BY 1`,

    prisma.$queryRaw<{ path: string; views: number }[]>`
      SELECT path, COUNT(*)::int AS views
      FROM "PageHit"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 15`,

    prisma.$queryRaw<
      { slug: string; name: string; units: number; revenue: number }[]
    >`
      SELECT
        COALESCE(line->>'productSlug', line->>'slug', 'unknown') AS slug,
        COALESCE(MAX(line->>'name'), COALESCE(line->>'productSlug', 'Product')) AS name,
        SUM(GREATEST(COALESCE((line->>'quantity')::int, 1), 1))::int AS units,
        SUM(
          GREATEST(COALESCE((line->>'unitPrice')::int, 0), 0)
          * GREATEST(COALESCE((line->>'quantity')::int, 1), 1)
        )::int AS revenue
      FROM "Order" o,
      LATERAL jsonb_array_elements(o.items::jsonb) AS line
      WHERE o."createdAt" >= ${start} AND o."createdAt" < ${endExclusive}
        AND o.status = 'paid'
      GROUP BY slug
      ORDER BY revenue DESC
      LIMIT 15`,

    prisma.$queryRaw<{ slug: string; name: string; count: number }[]>`
      SELECT
        COALESCE(line->>'productSlug', line->>'slug') AS slug,
        COALESCE(MAX(line->>'name'), 'Unknown') AS name,
        SUM(
          GREATEST(
            COALESCE((line->>'quantity')::int, (line->>'qty')::int, 1),
            1
          )
        )::int AS count
      FROM "CartTelemetry" c,
      LATERAL jsonb_array_elements(c.lines::jsonb) AS line
      WHERE c."updatedAt" >= ${start} AND c."updatedAt" < ${endExclusive}
        AND c."itemCount" > 0
        AND COALESCE(line->>'productSlug', line->>'slug') IS NOT NULL
      GROUP BY slug
      ORDER BY count DESC
      LIMIT 15`,

    prisma.$queryRaw<
      { slug: string; name: string; count: number }[]
    >`
      SELECT "vehicleSlug" AS slug,
             MAX("vehicleName") AS name,
             COUNT(*)::int AS count
      FROM "Booking"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}
      GROUP BY "vehicleSlug"
      ORDER BY count DESC
      LIMIT 15`,

    prisma.pageHit.count({
      where: { createdAt: { gte: start, lt: endExclusive } },
    }),

    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT "sessionId")::int AS count
      FROM "PageHit"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${endExclusive}`,

    prisma.order.count({
      where: { createdAt: { gte: start, lt: endExclusive } },
    }),

    prisma.order.count({
      where: {
        createdAt: { gte: start, lt: endExclusive },
        status: "paid",
      },
    }),

    prisma.order.aggregate({
      where: {
        createdAt: { gte: start, lt: endExclusive },
        status: "paid",
      },
      _sum: { total: true },
    }),

    prisma.booking.count({
      where: { createdAt: { gte: start, lt: endExclusive } },
    }),

    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT "sessionId")::int AS count
      FROM "CartTelemetry"
      WHERE "updatedAt" >= ${start} AND "updatedAt" < ${endExclusive}
        AND "itemCount" > 0`,

    prisma.cartTelemetry.count({
      where: {
        itemCount: { gt: 0 },
        updatedAt: { lt: abandonedCutoff, gte: start },
      },
    }),
  ]);

  const revenueByDay = fillDailySeries(
    dayKeys,
    revenueRows.map((r) => ({ date: r.date, revenue: num(r.revenue) })),
    { revenue: 0 }
  );

  const ordersByDay = fillDailySeries(
    dayKeys,
    ordersRows.map((r) => ({ date: r.date, count: num(r.count) })),
    { count: 0 }
  );

  const bookingsByDay = fillDailySeries(
    dayKeys,
    bookingsRows.map((r) => ({ date: r.date, count: num(r.count) })),
    { count: 0 }
  );

  const visitsByDay = fillDailySeries(
    dayKeys,
    trafficRows.map((r) => ({
      date: r.date,
      views: num(r.views),
      sessions: num(r.sessions),
    })),
    { views: 0, sessions: 0 }
  );

  const paidByDate = new Map(
    paidOrdersRows.map((r) => [r.date, num(r.count)])
  );
  const cartsByDate = new Map(
    cartDayRows.map((r) => [r.date, num(r.count)])
  );

  const conversionByDay: DailyConversion[] = dayKeys.map((date) => {
    const sessions =
      visitsByDay.find((v) => v.date === date)?.sessions ?? 0;
    const carts = cartsByDate.get(date) ?? 0;
    const paid = paidByDate.get(date) ?? 0;
    const conversionRate =
      sessions > 0 ? Math.round((paid / sessions) * 10000) / 100 : 0;
    return { date, sessions, carts, paid, conversionRate };
  });

  const uniqueSessions = num(sessionTotal[0]?.count);
  const cartSessions = num(cartSessionTotal[0]?.count);
  const paidOrders = paidOrderTotal;
  const revenuePaid = revenueTotal._sum.total ?? 0;

  const conversionPercent =
    uniqueSessions > 0
      ? Math.round((paidOrders / uniqueSessions) * 10000) / 100
      : 0;

  const cartRate =
    uniqueSessions > 0
      ? Math.round((cartSessions / uniqueSessions) * 10000) / 100
      : 0;

  const purchaseRate =
    cartSessions > 0
      ? Math.round((paidOrders / cartSessions) * 10000) / 100
      : 0;

  const topProducts: RankedRow[] = topProductRows.map((r) => ({
    key: r.slug,
    label: r.name,
    count: num(r.units),
    revenue: num(r.revenue),
  }));

  const topCartProducts: RankedRow[] = topCartRows.map((r) => ({
    key: r.slug,
    label: r.name,
    count: num(r.count),
  }));

  const topVehicles: RankedRow[] = topVehicleRows.map((r) => ({
    key: r.slug,
    label: r.name,
    count: num(r.count),
  }));

  return {
    range: {
      from: range.from,
      to: range.to,
      label: range.label,
      dayCount: dayKeys.length,
    },
    totals: {
      pageViews: pageViewTotal,
      uniqueSessions,
      orders: orderTotal,
      paidOrders,
      revenuePaid,
      bookings: bookingTotal,
      cartSessions,
      abandonedStaleSessions: abandonedTotal,
      conversionPercent,
    },
    funnel: {
      visits: uniqueSessions,
      carts: cartSessions,
      purchases: paidOrders,
      cartRate,
      purchaseRate,
    },
    series: {
      revenueByDay,
      ordersByDay,
      bookingsByDay,
      visitsByDay,
      conversionByDay,
    },
    topPages: topPagesRows.map((r) => ({
      path: r.path,
      views: num(r.views),
    })),
    topProducts,
    topCartProducts,
    topVehicles,
  };
}

export function analyticsReportToCsv(report: AnalyticsReport): string {
  const lines: string[] = [];
  const push = (row: unknown[]) => lines.push(row.map(String).join(","));

  push(["# Analytics export", report.range.label]);
  push(["from", report.range.from, "to", report.range.to]);
  push([]);

  push(["# Totals"]);
  push(["metric", "value"]);
  push(["pageViews", report.totals.pageViews]);
  push(["uniqueSessions", report.totals.uniqueSessions]);
  push(["orders", report.totals.orders]);
  push(["paidOrders", report.totals.paidOrders]);
  push(["revenuePaid", report.totals.revenuePaid]);
  push(["bookings", report.totals.bookings]);
  push(["cartSessions", report.totals.cartSessions]);
  push(["conversionPercent", report.totals.conversionPercent]);
  push([]);

  push(["# Daily series"]);
  push([
    "date",
    "revenue",
    "orders",
    "bookings",
    "pageViews",
    "sessions",
    "cartSessions",
    "paidOrders",
    "conversionRate",
  ]);
  for (const date of report.series.revenueByDay.map((d) => d.date)) {
    const rev =
      report.series.revenueByDay.find((d) => d.date === date)?.revenue ?? 0;
    const ord =
      report.series.ordersByDay.find((d) => d.date === date)?.count ?? 0;
    const book =
      report.series.bookingsByDay.find((d) => d.date === date)?.count ?? 0;
    const visit = report.series.visitsByDay.find((d) => d.date === date);
    const conv = report.series.conversionByDay.find((d) => d.date === date);
    push([
      date,
      rev,
      ord,
      book,
      visit?.views ?? 0,
      visit?.sessions ?? 0,
      conv?.carts ?? 0,
      conv?.paid ?? 0,
      conv?.conversionRate ?? 0,
    ]);
  }
  push([]);

  push(["# Top products (paid orders)"]);
  push(["slug", "name", "units", "revenue"]);
  for (const p of report.topProducts) {
    push([p.key, p.label, p.count, p.revenue ?? 0]);
  }
  push([]);

  push(["# Top vehicles (bookings)"]);
  push(["slug", "name", "bookings"]);
  for (const v of report.topVehicles) {
    push([v.key, v.label, v.count]);
  }
  push([]);

  push(["# Top pages"]);
  push(["path", "views"]);
  for (const p of report.topPages) {
    push([p.path, p.views]);
  }

  return lines.join("\n");
}
