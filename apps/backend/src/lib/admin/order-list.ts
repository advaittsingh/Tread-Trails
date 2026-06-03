import type { Order } from "@prisma/client";

import {
  parseOrderItems,
  parseShippingAddress,
  type AdminOrderLine,
} from "./order-detail.js";

export type OrderListFilters = {
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
};

export type OrderAutomotiveMeta = {
  vehicleLabel: string;
  primaryBrand: string | null;
  fitmentStatus: "verified" | "partial" | "unverified";
  fitmentLabel: string;
  installationBookingStatus: "none" | "pending" | "confirmed" | "completed";
  installationBookingLabel: string;
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
  items: AdminOrderLine[];
  shippingAddress: ReturnType<typeof parseShippingAddress>;
  automotive: OrderAutomotiveMeta;
};

export function paymentStatusFromOrder(order: {
  status: string;
  paymentMethod: string;
}): "unpaid" | "captured" | "refunded" {
  if (order.status === "cancelled") return "refunded";
  if (order.status === "pending" && order.paymentMethod !== "cod") return "unpaid";
  if (order.status === "pending" && order.paymentMethod === "cod") return "unpaid";
  return "captured";
}

export function parseItemsFromOrder(order: Order): AdminOrderLine[] {
  return parseOrderItems(order.items);
}

export function vehicleLabelFromItems(items: AdminOrderLine[]): string {
  for (const line of items) {
    const raw = line as AdminOrderLine & {
      vehicleName?: string;
      vehicleSlug?: string;
    };
    if (raw.vehicleName?.trim()) return raw.vehicleName.trim();
    if (raw.vehicleSlug?.trim()) return raw.vehicleSlug.trim();
  }
  return "—";
}
