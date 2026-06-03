export type OrdersSummary = {
  ordersToday: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  returnedOrders: number;
  revenueToday: number;
};

export type OrderAutomotiveMeta = {
  vehicleLabel: string;
  primaryBrand: string | null;
  fitmentStatus: "verified" | "partial" | "unverified";
  fitmentLabel: string;
  installationBookingStatus: "none" | "pending" | "confirmed" | "completed";
  installationBookingLabel: string;
};

export type OrderLine = {
  productSlug: string;
  variantId: string;
  variantLabel: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal: string;
};

export type AdminOrderListRow = {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicle: string;
  productsCount: number;
  itemQuantity: number;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentStatus: "unpaid" | "captured" | "refunded";
  createdAt: string;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  fulfilmentNotes: string;
  items: OrderLine[];
  shippingAddress: ShippingAddress | null;
  automotive: OrderAutomotiveMeta;
};

export type OrdersListResponse = {
  orders: AdminOrderListRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type OrdersFilterParams = {
  search?: string;
  customerName?: string;
  status?: string;
  payment?: string;
  paymentStatus?: string;
  phone?: string;
  vehicle?: string;
  brand?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type OrderDetail = {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: ShippingAddress | null;
  items: OrderLine[];
  lineCount: number;
  itemQuantity: number;
  subtotal: number;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  juspayGatewayOrderId: string | null;
  juspayCheckoutOrderRef: string | null;
  fulfilmentNotes: string;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  paidAt: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent = {
  id: string;
  kind: string;
  title: string;
  detail?: string;
  at: string;
};

export type InternalNote = {
  id: string;
  body: string;
  adminName: string | null;
  createdAt: string;
};

export type VehicleCompatibilityLine = {
  productSlug: string;
  productName: string;
  vehicles: Array<{ vehicleName: string; vehicleSlug: string }>;
};

export type OrderDetailResponse = {
  order: OrderDetail;
  timeline: TimelineEvent[];
  internalNotes: InternalNote[];
  automotive: OrderAutomotiveMeta;
  vehicleCompatibility: VehicleCompatibilityLine[];
};
