import type { Request, Response } from "express";

import { prisma } from "../../lib/prisma.js";
import { getInventoryDashboard } from "../../services/admin/inventory.service.js";

export async function getStats(_req: Request, res: Response) {
  try {
    const [totalOrders, paidOrderCount, revenueAgg, totalBookings, inventory] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "paid" } }),
        prisma.order.aggregate({
          where: { status: "paid" },
          _sum: { total: true },
        }),
        prisma.booking.count(),
        getInventoryDashboard().catch(() => null),
      ]);

    return res.json({
      totalOrders,
      paidOrderCount,
      totalRevenuePaid: revenueAgg._sum.total ?? 0,
      totalBookings,
      inventory: inventory
        ? {
            lowStockCount: inventory.lowStockCount,
            outOfStockCount: inventory.outOfStockCount,
            alerts: inventory.alerts.slice(0, 5),
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load stats" });
  }
}
