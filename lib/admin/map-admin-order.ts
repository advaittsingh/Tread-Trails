import type { Order } from "@prisma/client";

import {
  buildOrderTimeline,
  orderLineSubtotal,
  parseOrderItems,
  parseShippingAddress,
  type AdminOrderDetail,
  type OrderTimelineEvent,
} from "@/lib/admin/order-detail";

export function mapAdminOrderDetail(order: Order): AdminOrderDetail {
  const items = parseOrderItems(order.items);
  const subtotal = orderLineSubtotal(items);

  return {
    id: order.id,
    userId: order.userId,
    guestEmail: order.guestEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    shippingAddress: parseShippingAddress(order.shippingAddress),
    items,
    lineCount: items.length,
    itemQuantity: items.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    total: order.total,
    currency: order.currency,
    status: order.status,
    paymentMethod: order.paymentMethod,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    juspayGatewayOrderId: order.juspayGatewayOrderId,
    juspayCheckoutOrderRef: order.juspayCheckoutOrderRef,
    fulfilmentNotes: order.fulfilmentNotes,
    trackingNumber: order.trackingNumber,
    shippingCarrier: order.shippingCarrier,
    paidAt: order.paidAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function mapOrderTimeline(order: Order): OrderTimelineEvent[] {
  return buildOrderTimeline(order);
}
