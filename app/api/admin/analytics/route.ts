import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bucketCounts<T extends { createdAt?: Date; updatedAt?: Date }>(
  rows: T[],
  getDate: (r: T) => Date | undefined,
  days: string[]
): number[] {
  const map = new Map(days.map((d) => [d, 0]));
  for (const r of rows) {
    const dt = getDate(r);
    if (!dt) continue;
    const k = dayKey(dt);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return days.map((d) => map.get(d) ?? 0);
}

function lastNDaysKeys(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

export async function GET() {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  try {
    const days = lastNDaysKeys(30);
    const start = new Date(`${days[0]}T00:00:00.000Z`);

    const [orders, bookings, hits, carts] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: start } } }),
      prisma.booking.findMany({ where: { createdAt: { gte: start } } }),
      prisma.pageHit.findMany({ where: { createdAt: { gte: start } } }),
      prisma.cartTelemetry.findMany({ where: { updatedAt: { gte: start } } }),
    ]);

    const revenueByDay = days.map((dk) => {
      let sum = 0;
      for (const o of orders) {
        if (o.status !== "paid") continue;
        if (!o.createdAt) continue;
        if (dayKey(new Date(o.createdAt)) === dk) sum += o.total;
      }
      return { date: dk, revenue: sum };
    });

    const ordersByDay = days.map((dk) => ({
      date: dk,
      count: orders.filter(
        (o) => o.createdAt && dayKey(new Date(o.createdAt)) === dk
      ).length,
    }));

    const bookingsByDay = bucketCounts(bookings, (b) =>
      b.createdAt ? new Date(b.createdAt) : undefined
    , days).map((count, i) => ({ date: days[i], count }));

    const visitsByDay = bucketCounts(hits, (h) =>
      h.createdAt ? new Date(h.createdAt) : undefined
    , days).map((count, i) => ({ date: days[i], views: count }));

    const distinctSessions = new Set(hits.map((h) => h.sessionId)).size;
    const paidCount = orders.filter((o) => o.status === "paid").length;
    const cartSessions = new Set(
      carts.filter((c) => c.itemCount > 0).map((c) => c.sessionId)
    ).size;

    const conversionApprox =
      distinctSessions > 0 ? (paidCount / distinctSessions) * 100 : 0;

    const abandonedCandidates = carts.filter(
      (c) => c.itemCount > 0 && Date.now() - new Date(c.updatedAt).getTime() > 30 * 60 * 1000
    ).length;

    return NextResponse.json({
      windowDays: 30,
      totals: {
        pageViews: hits.length,
        uniqueSessions: distinctSessions,
        paidOrders: paidCount,
        revenuePaid: orders
          .filter((o) => o.status === "paid")
          .reduce((s, o) => s + o.total, 0),
        bookings: bookings.length,
        cartSessions,
        abandonedStaleSessions: abandonedCandidates,
        conversionPercentApprox: Math.round(conversionApprox * 100) / 100,
      },
      funnel: {
        visits: distinctSessions || hits.length,
        carts: cartSessions,
        purchases: paidCount,
      },
      series: {
        revenueByDay,
        ordersByDay,
        bookingsByDay,
        visitsByDay,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
