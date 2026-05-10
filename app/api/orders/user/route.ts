import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

type OrderItem = { name?: string; quantity?: number };

function itemsFromJson(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => typeof x === "object" && x !== null) as OrderItem[];
}

export async function GET() {
  const gate = await requireAuth();
  if ("response" in gate) return gate.response;

  try {
    const orders = await prisma.order.findMany({
      where: { userId: gate.auth.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        total: true,
        currency: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        items: true,
      },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        total: o.total,
        currency: o.currency,
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        itemSummary: itemsFromJson(o.items)
          .slice(0, 3)
          .map((i) => `${i.name ?? "Item"} × ${i.quantity ?? 1}`)
          .join(" · "),
        itemCount: itemsFromJson(o.items).length,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
