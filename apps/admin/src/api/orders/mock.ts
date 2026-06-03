import type {
  AdminOrderListRow,
  OrderDetailResponse,
  OrdersListResponse,
  OrdersSummary,
} from "./types";

export const mockOrdersSummary: OrdersSummary = {
  ordersToday: 7,
  pendingOrders: 12,
  processingOrders: 9,
  shippedOrders: 24,
  returnedOrders: 3,
  revenueToday: 284_500,
};

const sampleOrder: AdminOrderListRow = {
  id: "ord_mock_001",
  userId: null,
  customerName: "Amit Sharma",
  customerEmail: "amit@example.com",
  customerPhone: "+91 98765 43210",
  vehicle: "Toyota Fortuner",
  productsCount: 2,
  itemQuantity: 3,
  total: 89400,
  currency: "INR",
  status: "paid",
  paymentMethod: "razorpay",
  paymentStatus: "captured",
  createdAt: new Date().toISOString(),
  trackingNumber: null,
  shippingCarrier: null,
  fulfilmentNotes: "",
  items: [
    {
      productSlug: "bf-goodrich-ko2",
      variantId: "265-65-r17",
      variantLabel: "265/65 R17",
      name: "BFG KO2 All-Terrain",
      quantity: 4,
      unitPrice: 18500,
    },
  ],
  shippingAddress: {
    line1: "12 MG Road",
    city: "Bengaluru",
    region: "Karnataka",
    postal: "560001",
  },
  automotive: {
    vehicleLabel: "Toyota Fortuner",
    primaryBrand: "BFGoodrich",
    fitmentStatus: "verified",
    fitmentLabel: "Fitment verified",
    installationBookingStatus: "pending",
    installationBookingLabel: "Install booking pending",
  },
};

export const mockOrdersList: OrdersListResponse = {
  orders: [sampleOrder, { ...sampleOrder, id: "ord_mock_002", status: "packed" }],
  total: 2,
  page: 1,
  limit: 25,
  totalPages: 1,
};

export const mockOrderDetail: OrderDetailResponse = {
  order: {
    ...sampleOrder,
    guestEmail: null,
    lineCount: 1,
    subtotal: 74000,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    razorpayOrderId: "rzp_mock",
    razorpayPaymentId: "pay_mock",
    juspayGatewayOrderId: null,
    juspayCheckoutOrderRef: null,
    paidAt: new Date().toISOString(),
    packedAt: null,
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    updatedAt: new Date().toISOString(),
  },
  timeline: [
    {
      id: "placed",
      kind: "placed",
      title: "Order Created",
      at: new Date().toISOString(),
    },
    {
      id: "payment",
      kind: "payment",
      title: "Payment Captured",
      detail: "razorpay",
      at: new Date().toISOString(),
    },
  ],
  internalNotes: [],
  automotive: sampleOrder.automotive,
  vehicleCompatibility: [
    {
      productSlug: "bf-goodrich-ko2",
      productName: "BFG KO2 All-Terrain",
      vehicles: [{ vehicleName: "Toyota Fortuner", vehicleSlug: "toyota-fortuner" }],
    },
  ],
};
