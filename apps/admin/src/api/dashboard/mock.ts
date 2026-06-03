import type { AdminDashboardData } from "./types";

const days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (29 - i));
  return d.toISOString().slice(0, 10);
});

/** Static fallback when `VITE_DASHBOARD_MOCK=true` or API is unavailable in dev. */
export const mockDashboardData: AdminDashboardData = {
  brand: {
    name: "Tread Trails India",
    tagline: "Premium 4×4 aftermarket operations",
  },
  kpis: {
    revenueToday: 184_500,
    revenueThisMonth: 4_280_000,
    ordersToday: 7,
    pendingOrders: 12,
    inventoryValue: 18_450_000,
    newLeads: 5,
  },
  analytics: {
    rangeLabel: "Last 30 days",
    revenueByDay: days.map((date, i) => ({
      date,
      revenue: 120_000 + i * 4_200 + (i % 5) * 18_000,
    })),
    ordersByDay: days.map((date, i) => ({
      date,
      count: 3 + (i % 7) + Math.floor(i / 6),
    })),
    averageOrderValue: 42_800,
    revenuePaid30d: 3_840_000,
    orders30d: 89,
  },
  operational: {
    lowStockProducts: [
      {
        productId: "1",
        name: "BFG KO2 265/65 R17",
        sku: "TT-KO2-265",
        available: 2,
        threshold: 5,
      },
      {
        productId: "2",
        name: "ARB Old Man Emu 2\" Lift",
        sku: "TT-OME-LIFT",
        available: 1,
        threshold: 3,
      },
    ],
    outOfStockProducts: [
      { productId: "3", name: "Snorkel — Safari Armax", sku: "TT-SNORK-01" },
    ],
    pendingShipments: 9,
    bookingRequests: [
      {
        id: "bk1",
        contactName: "Rahul Mehta",
        vehicleName: "Mahindra Thar",
        service: "Lift kit consultation",
        date: "2026-06-05",
        time: "11:00",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ],
    lowStockCount: 2,
    outOfStockCount: 1,
  },
  recentOrders: [
    {
      id: "ord_demo_1",
      customer: "Amit Sharma",
      vehicle: "Toyota Fortuner",
      amount: 89_400,
      status: "paid",
      date: new Date().toISOString(),
    },
    {
      id: "ord_demo_2",
      customer: "Priya Nair",
      vehicle: "Jeep Compass",
      amount: 124_000,
      status: "packed",
      date: new Date().toISOString(),
    },
  ],
  leads: [
    {
      id: "lead1",
      name: "Vikram Singh",
      vehicle: "Land Rover Defender",
      inquiry: "Full overland build — wheels, lift, roof rack",
      status: "new",
      createdAt: new Date().toISOString(),
    },
  ],
  compatibility: {
    totalProducts: 240,
    withFitment: 198,
    missing: 42,
    completionPercent: 82.5,
  },
  activity: [
    {
      id: "a1",
      type: "Order Created",
      detail: "order · ord_demo",
      actor: "Studio Admin",
      at: new Date().toISOString(),
    },
    {
      id: "a2",
      type: "Product Updated",
      detail: "product · bf-goodrich",
      actor: "Studio Admin",
      at: new Date().toISOString(),
    },
  ],
  generatedAt: new Date().toISOString(),
};
