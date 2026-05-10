import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const status = searchParams.get("status")?.trim();
  const payment = searchParams.get("payment")?.trim();
  const search = searchParams.get("search")?.trim();

  const where: Prisma.OrderWhereInput = {};
  if (status && ["pending", "paid", "shipped", "cancelled"].includes(status)) {
    where.status = status as OrderStatus;
  }
  const pmKnown = ["stripe", "cod", "razorpay", "juspay"] as const;
  if (payment && pmKnown.includes(payment as (typeof pmKnown)[number])) {
    where.paymentMethod = payment;
  }
  if (search) {
    where.OR = [
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { id: { equals: search } },
    ];
  }

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        userId: o.userId ?? null,
        customerEmail: o.customerEmail,
        customerName: o.customerName,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        items: o.items,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
