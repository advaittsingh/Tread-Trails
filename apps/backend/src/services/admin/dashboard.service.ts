import { OrderStatus, BookingStatus } from "@prisma/client";

import { buildAnalyticsReport } from "../../lib/analytics/build-report.js";
import { parseAnalyticsDateRange } from "../../lib/analytics/date-range.js";
import { mapAdminLeadListRow } from "../../lib/admin/map-admin-lead.js";
import { prisma } from "../../lib/prisma.js";
import { getInventoryDashboard } from "./inventory.service.js";

function utcDayStart(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function utcMonthStart(d = new Date()): Date {
  const x = utcDayStart(d);
  x.setUTCDate(1);
  return x;
}

function orderVehicleLabel(items: unknown): string {
  if (!Array.isArray(items)) return "—";
  for (const line of items) {
    if (!line || typeof line !== "object") continue;
    const row = line as Record<string, unknown>;
    const name = row.vehicleName ?? row.vehicleSlug ?? row.vehicle;
    if (name != null && String(name).trim()) return String(name);
  }
  return "—";
}

function mapAuditToActivity(action: string, entity: string): string {
  const a = action.toLowerCase();
  if (a.includes("order") && (a.includes("create") || entity === "order")) {
    return "Order Created";
  }
  if (a.startsWith("order.")) return "Order Updated";
  if (a.includes("product") || entity === "product") return "Product Updated";
  if (a.includes("lead") && a.includes("assign")) return "Lead Assigned";
  if (a.includes("lead")) return "Lead Updated";
  if (a.includes("booking") && a.includes("confirm")) return "Booking Confirmed";
  if (a.includes("booking")) return "Booking Updated";
  if (a.includes("inventory")) return "Inventory Updated";
  return action.replace(/\./g, " ");
}

export type AdminDashboardPayload = Awaited<ReturnType<typeof buildAdminDashboard>>;

export async function buildAdminDashboard() {
  const todayStart = utcDayStart();
  const monthStart = utcMonthStart();
  const analyticsRange = parseAnalyticsDateRange(
    new URLSearchParams({ days: "30" })
  );
  if ("error" in analyticsRange) {
    throw new Error(analyticsRange.error);
  }

  const [
    revenueTodayAgg,
    revenueMonthAgg,
    ordersToday,
    pendingOrders,
    newLeads,
    inventory,
    analytics,
    recentOrdersRaw,
    recentLeadsRaw,
    pendingBookings,
    pendingShipments,
    outOfStockRows,
    totalProducts,
    productsWithFitment,
    auditRows,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "paid", createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: "paid", createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: OrderStatus.pending } }),
    prisma.lead.count({ where: { status: "new" } }),
    getInventoryDashboard(),
    buildAnalyticsReport(analyticsRange),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        total: true,
        status: true,
        createdAt: true,
        items: true,
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.booking.findMany({
      where: { status: BookingStatus.pending },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 8,
      select: {
        id: true,
        contactName: true,
        vehicleName: true,
        service: true,
        date: true,
        time: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.paid, OrderStatus.packed] } },
    }),
    prisma.productInventory.findMany({
      where: { stockQuantity: { lte: 0 } },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.count(),
    prisma.product.count({
      where: { vehicleCompatibilities: { some: {} } },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const lowStockProducts = inventory.alerts.slice(0, 8).map((a) => ({
    productId: a.productId,
    name: a.name,
    sku: a.sku,
    available: a.available,
    threshold: a.threshold,
  }));

  const outOfStockProducts = outOfStockRows.map((row) => ({
    productId: row.productId,
    name: row.product.name,
    sku: row.sku,
  }));

  const paidOrders = analytics.totals.paidOrders;
  const averageOrderValue =
    paidOrders > 0
      ? Math.round(analytics.totals.revenuePaid / paidOrders)
      : 0;

  const missingCompatibility = Math.max(0, totalProducts - productsWithFitment);
  const completionPercent =
    totalProducts > 0
      ? Math.round((productsWithFitment / totalProducts) * 1000) / 10
      : 0;

  const adminIds = [...new Set(auditRows.map((r) => r.adminId))];
  const admins = adminIds.length
    ? await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, name: true },
      })
    : [];
  const adminById = new Map(admins.map((a) => [a.id, a.name]));

  return {
    brand: {
      name: "Tread Trails India",
      tagline: "Premium 4×4 aftermarket operations",
    },
    kpis: {
      revenueToday: revenueTodayAgg._sum.total ?? 0,
      revenueThisMonth: revenueMonthAgg._sum.total ?? 0,
      ordersToday,
      pendingOrders,
      inventoryValue: inventory.inventoryValue,
      newLeads,
    },
    analytics: {
      rangeLabel: analytics.range.label,
      revenueByDay: analytics.series.revenueByDay,
      ordersByDay: analytics.series.ordersByDay,
      averageOrderValue,
      revenuePaid30d: analytics.totals.revenuePaid,
      orders30d: analytics.totals.orders,
    },
    operational: {
      lowStockProducts,
      outOfStockProducts,
      pendingShipments,
      bookingRequests: pendingBookings.map((b) => ({
        id: b.id,
        contactName: b.contactName,
        vehicleName: b.vehicleName,
        service: b.service,
        date: b.date,
        time: b.time,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      })),
      lowStockCount: inventory.lowStockCount,
      outOfStockCount: inventory.outOfStockCount,
    },
    recentOrders: recentOrdersRaw.map((o) => ({
      id: o.id,
      customer: o.customerName || o.customerEmail,
      vehicle: orderVehicleLabel(o.items),
      amount: o.total,
      status: o.status,
      date: o.createdAt.toISOString(),
    })),
    leads: recentLeadsRaw.map((lead) => {
      const row = mapAdminLeadListRow(lead);
      return {
        id: row.id,
        name: row.displayName,
        vehicle:
          lead.companyName?.trim() ||
          lead.subject?.trim() ||
          "General inquiry",
        inquiry:
          lead.message?.trim() ||
          lead.requirements?.trim() ||
          lead.subject?.trim() ||
          "—",
        status: row.status,
        createdAt: row.createdAt,
      };
    }),
    compatibility: {
      totalProducts,
      withFitment: productsWithFitment,
      missing: missingCompatibility,
      completionPercent,
    },
    activity: auditRows.map((row) => ({
      id: row.id,
      type: mapAuditToActivity(row.action, row.entity),
      detail: `${row.entity}${row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}`,
      actor: adminById.get(row.adminId) ?? "Admin",
      at: row.createdAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  };
}
