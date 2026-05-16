import { z } from "zod";

const orderLineSchema = z.object({
  productSlug: z.string(),
  variantId: z.string(),
  variantLabel: z.string(),
  name: z.string(),
  image: z.string().optional().default(""),
  quantity: z.number(),
  unitPrice: z.number(),
});

const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  region: z.string(),
  postal: z.string(),
});

export type AdminOrderLine = z.infer<typeof orderLineSchema>;
export type AdminShippingAddress = z.infer<typeof addressSchema>;

export type AdminOrderDetail = {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: AdminShippingAddress | null;
  items: AdminOrderLine[];
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
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderTimelineEvent = {
  id: string;
  kind:
    | "placed"
    | "payment"
    | "fulfilment"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "admin";
  title: string;
  detail?: string;
  at: string;
};

export function parseOrderItems(raw: unknown): AdminOrderLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: AdminOrderLine[] = [];
  for (const row of raw) {
    const parsed = orderLineSchema.safeParse(row);
    if (parsed.success) lines.push(parsed.data);
  }
  return lines;
}

export function parseShippingAddress(raw: unknown): AdminShippingAddress | null {
  const parsed = addressSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function orderLineSubtotal(lines: AdminOrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function formatShippingAddress(addr: AdminShippingAddress): string[] {
  const lines = [addr.line1];
  if (addr.line2?.trim()) lines.push(addr.line2);
  lines.push(`${addr.city}, ${addr.region} ${addr.postal}`);
  return lines;
}

type OrderTimestamps = {
  status: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  paymentMethod: string;
  stripePaymentIntentId: string | null;
  razorpayPaymentId: string | null;
};

export function buildOrderTimeline(order: OrderTimestamps): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [
    {
      id: "placed",
      kind: "placed",
      title: "Order placed",
      detail:
        order.paymentMethod === "cod"
          ? "Cash on delivery — awaiting confirmation"
          : `Checkout via ${order.paymentMethod}`,
      at: order.createdAt.toISOString(),
    },
  ];

  const paymentAt =
    order.paidAt ??
    (["paid", "shipped", "delivered"].includes(order.status)
      ? order.updatedAt
      : null);

  if (
    paymentAt &&
    (order.stripePaymentIntentId ||
      order.razorpayPaymentId ||
      order.paymentMethod === "cod" ||
      order.status !== "pending")
  ) {
    events.push({
      id: "payment",
      kind: "payment",
      title:
        order.paymentMethod === "cod"
          ? "COD order accepted"
          : "Payment confirmed",
      detail: order.paymentMethod,
      at: paymentAt.toISOString(),
    });
  }

  if (order.shippedAt || order.status === "shipped" || order.status === "delivered") {
    events.push({
      id: "shipped",
      kind: "shipped",
      title: "Marked shipped",
      at: (order.shippedAt ?? order.updatedAt).toISOString(),
    });
  }

  if (order.deliveredAt || order.status === "delivered") {
    events.push({
      id: "delivered",
      kind: "delivered",
      title: "Marked delivered",
      at: (order.deliveredAt ?? order.updatedAt).toISOString(),
    });
  }

  if (order.cancelledAt || order.status === "cancelled") {
    events.push({
      id: "cancelled",
      kind: "cancelled",
      title: "Order cancelled",
      at: (order.cancelledAt ?? order.updatedAt).toISOString(),
    });
  }

  return events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
}

export const SHIPPING_CARRIERS = [
  "Blue Dart",
  "Delhivery",
  "DTDC",
  "FedEx",
  "India Post",
  "Professional Couriers",
  "Self / studio pickup",
  "Other",
] as const;
