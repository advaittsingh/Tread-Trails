import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const lineSchema = z.object({
  productSlug: z.string().min(1),
  quantity: z.number().int().min(0),
  name: z.string().optional(),
});

const bodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  lines: z.array(lineSchema),
  itemCount: z.number().int().min(0),
  subtotalHint: z.number().min(0).optional(),
  userEmail: z.string().email().optional(),
  lastPath: z.string().max(512).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { sessionId, lines, itemCount, subtotalHint, userEmail, lastPath } =
    parsed.data;

  try {
    const setDoc: Record<string, unknown> = {
      lines,
      itemCount,
      subtotalHint: subtotalHint ?? 0,
      lastPath: lastPath ?? "",
      updatedAt: new Date(),
    };
    if (userEmail?.trim()) {
      setDoc.userEmail = userEmail.trim().toLowerCase();
    }

    await prisma.cartTelemetry.upsert({
      where: { sessionId },
      create: {
        sessionId,
        lines,
        itemCount,
        subtotalHint: subtotalHint ?? 0,
        userEmail: userEmail?.trim() ? userEmail.trim().toLowerCase() : null,
        lastPath: lastPath ?? "",
      },
      update: {
        lines,
        itemCount,
        subtotalHint: subtotalHint ?? 0,
        userEmail: userEmail?.trim() ? userEmail.trim().toLowerCase() : null,
        lastPath: lastPath ?? "",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Cart telemetry failed" }, { status: 500 });
  }
}
