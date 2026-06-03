import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { prisma } from "../../lib/prisma.js";
import {
  mapCartTelemetryRow,
  recoverAbandonedCart,
} from "../../services/admin/cart-recovery.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

const recoverBodySchema = z.object({
  sessionId: z.string().min(8).max(128),
  action: z.enum(["email", "whatsapp", "mark_recovered", "mark_converted"]),
  template: z.enum(["complete_order", "cart_waiting"]).optional(),
  firstName: z.string().max(80).optional(),
  force: z.boolean().optional(),
  orderId: z.string().max(64).optional(),
});

export async function listCarts(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const search = String(req.query.search ?? "").trim();
  const view = String(req.query.view ?? "").trim();

  let where: Prisma.CartTelemetryWhereInput = { itemCount: { gt: 0 } };

  if (search) {
    where = {
      AND: [
        where,
        {
          OR: [
            { sessionId: { contains: search, mode: "insensitive" } },
            { userEmail: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { lastPath: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };
  }

  if (view === "recoverable") {
    where = {
      AND: [where, { convertedAt: null }, { userEmail: { not: null } }],
    };
  } else if (view === "emailed") {
    where = { AND: [where, { recoveryEmailSentAt: { not: null } }] };
  } else if (view === "converted") {
    where = { AND: [where, { convertedAt: { not: null } }] };
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.cartTelemetry.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.cartTelemetry.count({ where }),
    ]);

    const carts = await Promise.all(rows.map((r) => mapCartTelemetryRow(r)));

    return res.json({
      carts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("[admin/carts] list failed", e);
    return res.status(500).json({ error: "Failed to load carts" });
  }
}

export async function recoverCart(req: AuthedRequest, res: Response) {
  const parsed = recoverBodySchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const result = await recoverAbandonedCart({
    ...parsed.data,
    adminId: adminId(req),
  });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  await logAdminAction({
    adminId: adminId(req),
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

  return res.json({
    ok: true,
    action: result.action,
    whatsappUrl: result.whatsappUrl,
    emailId: result.emailId,
    provider: result.provider,
  });
}
