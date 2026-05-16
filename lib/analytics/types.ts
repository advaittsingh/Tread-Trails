export type DailyCount = { date: string; count: number };
export type DailyRevenue = { date: string; revenue: number };
export type DailyViews = { date: string; views: number; sessions: number };
export type DailyConversion = {
  date: string;
  sessions: number;
  carts: number;
  paid: number;
  conversionRate: number;
};

export type RankedRow = {
  key: string;
  label: string;
  count: number;
  revenue?: number;
};

export type AnalyticsReport = {
  range: {
    from: string;
    to: string;
    label: string;
    dayCount: number;
  };
  totals: {
    pageViews: number;
    uniqueSessions: number;
    orders: number;
    paidOrders: number;
    revenuePaid: number;
    bookings: number;
    cartSessions: number;
    abandonedStaleSessions: number;
    conversionPercent: number;
  };
  funnel: {
    visits: number;
    carts: number;
    purchases: number;
    cartRate: number;
    purchaseRate: number;
  };
  series: {
    revenueByDay: DailyRevenue[];
    ordersByDay: DailyCount[];
    bookingsByDay: DailyCount[];
    visitsByDay: DailyViews[];
    conversionByDay: DailyConversion[];
  };
  topPages: { path: string; views: number }[];
  topProducts: RankedRow[];
  topCartProducts: RankedRow[];
  topVehicles: RankedRow[];
};
