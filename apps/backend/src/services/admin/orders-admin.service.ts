import type { Order, Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";

import {
  mapAdminOrderDetail,
  mapOrderTimeline,
} from "../../lib/admin/map-admin-order.js";
import { parseShippingAddress } from "../../lib/admin/order-detail.js";
import {
  type AdminOrderListRow,
  type OrderAutomotiveMeta,
  type OrderListFilters,
  parseItemsFromOrder,
  paymentStatusFromOrder,
  vehicleLabelFromItems,
} from "../../lib/admin/order-list.js";
import { prisma } from "../../lib/prisma.js";

function utcDayStart(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function parseDateStart(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateEndExclusive(ymd: string): Date | null {
  const start = parseDateStart(ymd);
  if (!start) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
}

export async function getOrdersSummary() {
  const todayStart = utcDayStart();

  const [
    ordersToday,
    pendingOrders,
    processingOrders,
    shippedOrders,
    returnedOrders,
    revenueTodayAgg,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: OrderStatus.pending } }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.paid, OrderStatus.packed] } },
    }),
    prisma.order.count({ where: { status: OrderStatus.shipped } }),
    prisma.order.count({ where: { status: OrderStatus.cancelled } }),
    prisma.order.aggregate({
      where: { status: OrderStatus.paid, createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
  ]);

  return {
    ordersToday,
    pendingOrders,
    processingOrders,
    shippedOrders,
    returnedOrders,
    revenueToday: revenueTodayAgg._sum.total ?? 0,
  };
}

async function productSlugsForBrand(brand: string): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { brand: { contains: brand, mode: "insensitive" } },
    select: { slug: true },
    take: 200,
  });
  return rows.map((r) => r.slug);
}

export async function buildOrdersWhere(
  filters: OrderListFilters
): Promise<Prisma.OrderWhereInput> {
  const where: Prisma.OrderWhereInput = {};
  const and: Prisma.OrderWhereInput[] = [];

  const status = filters.status?.trim();
  if (
    status &&
    ["pending", "paid", "packed", "shipped", "delivered", "cancelled"].includes(
      status
    )
  ) {
    where.status = status as OrderStatus;
  }

  const payment = filters.payment?.trim();
  const pmKnown = ["stripe", "cod", "razorpay", "juspay"] as const;
  if (payment && pmKnown.includes(payment as (typeof pmKnown)[number])) {
    where.paymentMethod = payment;
  }

  const paymentStatus = filters.paymentStatus?.trim();
  if (paymentStatus === "unpaid") {
    and.push({ status: OrderStatus.pending });
  } else if (paymentStatus === "captured") {
    and.push({
      status: {
        in: [
          OrderStatus.paid,
          OrderStatus.packed,
          OrderStatus.shipped,
          OrderStatus.delivered,
        ],
      },
    });
  } else if (paymentStatus === "refunded") {
    and.push({ status: OrderStatus.cancelled });
  }

  const search = filters.search?.trim();
  if (search) {
    and.push({
      OR: [
        { id: { equals: search } },
        { id: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const customerName = filters.customerName?.trim();
  if (customerName) {
    and.push({
      customerName: { contains: customerName, mode: "insensitive" },
    });
  }

  const phone = filters.phone?.trim();
  if (phone) {
    and.push({
      customerPhone: { contains: phone, mode: "insensitive" },
    });
  }

  const dateFrom = filters.dateFrom?.trim();
  if (dateFrom) {
    const start = parseDateStart(dateFrom);
    if (start) and.push({ createdAt: { gte: start } });
  }

  const dateTo = filters.dateTo?.trim();
  if (dateTo) {
    const end = parseDateEndExclusive(dateTo);
    if (end) and.push({ createdAt: { lt: end } });
  }

  const vehicle = filters.vehicle?.trim();
  if (vehicle) {
    and.push({
      OR: [
        { items: { string_contains: vehicle, mode: "insensitive" } },
        {
          user: {
            is: {
              preferredVehicleSlug: {
                contains: vehicle,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  const brand = filters.brand?.trim();
  if (brand) {
    const slugs = await productSlugsForBrand(brand);
    if (slugs.length === 0) {
      and.push({ id: { in: [] } });
    } else {
      and.push({
        OR: slugs.map((slug) => ({
          items: { string_contains: slug, mode: "insensitive" as const },
        })),
      });
    }
  }

  if (and.length > 0) {
    return { ...where, AND: and };
  }
  return where;
}

type FitmentMap = Map<
  string,
  { hasFitment: boolean; vehicles: string[]; brand: string | null }
>;

async function buildFitmentMap(
  productSlugs: string[]
): Promise<FitmentMap> {
  const map: FitmentMap = new Map();
  if (productSlugs.length === 0) return map;

  const products = await prisma.product.findMany({
    where: { slug: { in: productSlugs } },
    select: {
      slug: true,
      brand: true,
      vehicleCompatibilities: {
        take: 3,
        select: { vehicle: { select: { name: true, slug: true } } },
      },
    },
  });

  for (const p of products) {
    const vehicles = p.vehicleCompatibilities.map((c) => c.vehicle.name);
    map.set(p.slug, {
      hasFitment: p.vehicleCompatibilities.length > 0,
      vehicles,
      brand: p.brand ?? null,
    });
  }

  return map;
}

async function bookingStatusForEmail(
  email: string
): Promise<OrderAutomotiveMeta["installationBookingStatus"]> {
  const booking = await prisma.booking.findFirst({
    where: { contactEmail: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });
  if (!booking) return "none";
  if (booking.status === "pending") return "pending";
  if (booking.status === "confirmed") return "confirmed";
  if (booking.status === "completed") return "completed";
  return "none";
}

function deriveAutomotive(
  order: Order,
  items: ReturnType<typeof parseItemsFromOrder>,
  fitmentMap: FitmentMap,
  bookingStatus: OrderAutomotiveMeta["installationBookingStatus"]
): OrderAutomotiveMeta {
  const slugs = items.map((i) => i.productSlug);
  let withFitment = 0;
  const vehicleNames = new Set<string>();
  const brands = new Set<string>();

  for (const slug of slugs) {
    const meta = fitmentMap.get(slug);
    if (meta?.brand) brands.add(meta.brand);
    if (meta?.hasFitment) {
      withFitment += 1;
      meta.vehicles.forEach((v) => vehicleNames.add(v));
    }
  }

  let fitmentStatus: OrderAutomotiveMeta["fitmentStatus"] = "unverified";
  let fitmentLabel = "Fitment not mapped";
  if (slugs.length > 0 && withFitment === slugs.length) {
    fitmentStatus = "verified";
    fitmentLabel = "Fitment verified";
  } else if (withFitment > 0) {
    fitmentStatus = "partial";
    fitmentLabel = `${withFitment}/${slugs.length} SKUs mapped`;
  }

  const itemVehicle = vehicleLabelFromItems(items);
  const vehicleLabel =
    itemVehicle !== "—"
      ? itemVehicle
      : vehicleNames.size > 0
        ? [...vehicleNames].slice(0, 2).join(", ")
        : "—";

  const bookingLabels: Record<
    OrderAutomotiveMeta["installationBookingStatus"],
    string
  > = {
    none: "No studio booking",
    pending: "Install booking pending",
    confirmed: "Install booking confirmed",
    completed: "Install completed",
  };

  return {
    vehicleLabel,
    primaryBrand: brands.size > 0 ? [...brands][0]! : null,
    fitmentStatus,
    fitmentLabel,
    installationBookingStatus: bookingStatus,
    installationBookingLabel: bookingLabels[bookingStatus],
  };
}

export async function mapOrderToListRow(
  order: Order,
  fitmentMap: FitmentMap,
  bookingCache: Map<string, OrderAutomotiveMeta["installationBookingStatus"]>
): Promise<AdminOrderListRow> {
  const items = parseItemsFromOrder(order);
  let bookingStatus = bookingCache.get(order.customerEmail);
  if (bookingStatus === undefined) {
    bookingStatus = await bookingStatusForEmail(order.customerEmail);
    bookingCache.set(order.customerEmail, bookingStatus);
  }

  const automotive = deriveAutomotive(order, items, fitmentMap, bookingStatus);

  return {
    id: order.id,
    userId: order.userId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    vehicle: automotive.vehicleLabel,
    productsCount: items.length,
    itemQuantity: items.reduce((n, l) => n + l.quantity, 0),
    total: order.total,
    currency: order.currency,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: paymentStatusFromOrder(order),
    createdAt: order.createdAt.toISOString(),
    trackingNumber: order.trackingNumber,
    shippingCarrier: order.shippingCarrier,
    fulfilmentNotes: order.fulfilmentNotes,
    items,
    shippingAddress: parseShippingAddress(order.shippingAddress),
    automotive,
  };
}

export async function listAdminOrders(
  where: Prisma.OrderWhereInput,
  skip: number,
  take: number
) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  const allSlugs = new Set<string>();
  for (const o of orders) {
    for (const line of parseItemsFromOrder(o)) {
      allSlugs.add(line.productSlug);
    }
  }

  const fitmentMap = await buildFitmentMap([...allSlugs]);
  const bookingCache = new Map<
    string,
    OrderAutomotiveMeta["installationBookingStatus"]
  >();

  const rows = await Promise.all(
    orders.map((o) => mapOrderToListRow(o, fitmentMap, bookingCache))
  );

  return { orders: rows, total };
}

export async function getAdminOrderDetailBundle(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  const [auditLog, internalNotes] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where: { entity: "order", entityId: order.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        meta: true,
        createdAt: true,
        adminId: true,
      },
    }),
    prisma.orderInternalNote.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { name: true } } },
    }),
  ]);

  const timeline = mapOrderTimeline(order);

  for (const entry of auditLog) {
    if (entry.action === "order.status_update" || entry.action === "order.update") {
      const meta = entry.meta as { from?: string; to?: string } | null;
      timeline.push({
        id: `audit-${entry.id}`,
        kind: "admin",
        title:
          meta?.from && meta?.to
            ? `Status: ${meta.from} → ${meta.to}`
            : "Order updated",
        detail: "Admin update",
        at: entry.createdAt.toISOString(),
      });
    }
  }

  for (const note of internalNotes) {
    timeline.push({
      id: `note-${note.id}`,
      kind: "admin",
      title: "Internal note",
      detail: note.body.slice(0, 200),
      at: note.createdAt.toISOString(),
    });
  }

  timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const items = parseItemsFromOrder(order);
  const fitmentMap = await buildFitmentMap(items.map((i) => i.productSlug));
  const bookingStatus = await bookingStatusForEmail(order.customerEmail);
  const automotive = deriveAutomotive(order, items, fitmentMap, bookingStatus);

  const slugs = items.map((i) => i.productSlug);
  const compatRows =
    slugs.length > 0
      ? await prisma.productVehicleCompatibility.findMany({
          where: { product: { slug: { in: slugs } } },
          select: {
            product: { select: { slug: true, name: true } },
            vehicle: { select: { name: true, slug: true } },
          },
        })
      : [];

  const compatibilityByProduct = new Map<
    string,
    Array<{ vehicleName: string; vehicleSlug: string }>
  >();
  for (const row of compatRows) {
    const list = compatibilityByProduct.get(row.product.slug) ?? [];
    list.push({
      vehicleName: row.vehicle.name,
      vehicleSlug: row.vehicle.slug,
    });
    compatibilityByProduct.set(row.product.slug, list);
  }

  return {
    order: mapAdminOrderDetail(order),
    timeline,
    internalNotes: internalNotes.map((n) => ({
      id: n.id,
      body: n.body,
      adminName: n.admin?.name ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    automotive,
    vehicleCompatibility: items.map((line) => ({
      productSlug: line.productSlug,
      productName: line.name,
      vehicles: compatibilityByProduct.get(line.productSlug) ?? [],
    })),
  };
}

export function ordersToCsv(rows: AdminOrderListRow[]): string {
  const header = [
    "Order ID",
    "Customer",
    "Email",
    "Phone",
    "Vehicle",
    "Products",
    "Total",
    "Payment",
    "Payment Status",
    "Order Status",
    "Created",
    "Tracking",
    "Carrier",
  ];
  const lines = rows.map((o) =>
    [
      o.id,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.vehicle,
      String(o.productsCount),
      String(o.total),
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      o.createdAt,
      o.trackingNumber ?? "",
      o.shippingCarrier ?? "",
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
