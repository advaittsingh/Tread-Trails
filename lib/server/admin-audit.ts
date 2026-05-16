import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logAdminAction(opts: {
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: opts.adminId,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        meta: opts.meta as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error("admin audit log failed", e);
  }
}
