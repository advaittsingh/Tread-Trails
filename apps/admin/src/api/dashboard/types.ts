export type DashboardKpis = {
  revenueToday: number;
  revenueThisMonth: number;
  ordersToday: number;
  pendingOrders: number;
  inventoryValue: number;
  newLeads: number;
};

export type DashboardDailyPoint = { date: string; revenue?: number; count?: number };

export type DashboardAnalytics = {
  rangeLabel: string;
  revenueByDay: Array<{ date: string; revenue: number }>;
  ordersByDay: Array<{ date: string; count: number }>;
  averageOrderValue: number;
  revenuePaid30d: number;
  orders30d: number;
};

export type StockAlertRow = {
  productId: string;
  name: string;
  sku: string;
  available?: number;
  threshold?: number;
};

export type BookingRequestRow = {
  id: string;
  contactName: string;
  vehicleName: string;
  service: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
};

export type DashboardOperational = {
  lowStockProducts: StockAlertRow[];
  outOfStockProducts: Array<{ productId: string; name: string; sku: string }>;
  pendingShipments: number;
  bookingRequests: BookingRequestRow[];
  lowStockCount: number;
  outOfStockCount: number;
};

export type DashboardOrderRow = {
  id: string;
  customer: string;
  vehicle: string;
  amount: number;
  status: string;
  date: string;
};

export type DashboardLeadRow = {
  id: string;
  name: string;
  vehicle: string;
  inquiry: string;
  status: string;
  createdAt: string;
};

export type DashboardCompatibility = {
  totalProducts: number;
  withFitment: number;
  missing: number;
  completionPercent: number;
};

export type DashboardActivity = {
  id: string;
  type: string;
  detail: string;
  actor: string;
  at: string;
};

export type AdminDashboardData = {
  brand: { name: string; tagline: string };
  kpis: DashboardKpis;
  analytics: DashboardAnalytics;
  operational: DashboardOperational;
  recentOrders: DashboardOrderRow[];
  leads: DashboardLeadRow[];
  compatibility: DashboardCompatibility;
  activity: DashboardActivity[];
  generatedAt: string;
};
