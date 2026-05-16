import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { InboxKind } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;
  const kindParam = searchParams.get("kind")?.trim();
  const unreadOnly = searchParams.get("unread") === "1";

  const where: Prisma.InboxSubmissionWhereInput = {};
  if (kindParam === InboxKind.contact || kindParam === InboxKind.corporate) {
    where.kind = kindParam;
  }
  if (unreadOnly) {
    where.readAt = null;
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.inboxSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inboxSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
  }
}
