import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { requireAdmin } from "@/lib/auth/request-user";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const status = searchParams.get("status")?.trim();
  const search = searchParams.get("search")?.trim();

  const filter: Record<string, unknown> = {};
  if (status && ["pending", "paid", "shipped", "cancelled"].includes(status)) {
    filter.status = status;
  }
  if (search) {
    filter.$or = [
      { customerEmail: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
    ];
    if (mongoose.isValidObjectId(search)) {
      (filter.$or as object[]).push({
        _id: new mongoose.Types.ObjectId(search),
      });
    }
  }

  try {
    await connectDB();
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        userId: o.userId ? String(o.userId) : null,
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
