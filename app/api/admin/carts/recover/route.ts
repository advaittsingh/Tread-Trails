import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { recoverAbandonedCart } from "@/lib/server/cart-recovery";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  action: z.enum(["email", "whatsapp", "mark_recovered", "mark_converted"]),
  template: z.enum(["complete_order", "cart_waiting"]).optional(),
  firstName: z.string().max(80).optional(),
  force: z.boolean().optional(),
  orderId: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await recoverAbandonedCart({
    ...parsed.data,
    adminId: gate.auth.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAdminAction({
    adminId: gate.auth.userId,
    action: `cart_recovery_${parsed.data.action}`,
    entity: "cart_telemetry",
    entityId: parsed.data.sessionId,
    meta: {
      template: parsed.data.template,
      force: parsed.data.force,
      orderId: parsed.data.orderId,
      emailId: "emailId" in result ? result.emailId : undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    action: result.action,
    whatsappUrl: result.whatsappUrl,
    emailId: result.emailId,
    provider: result.provider,
  });
}
