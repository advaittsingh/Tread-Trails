import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma.js";

export type AdminAuditInput = {
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
};

export async function logAdminAction(opts: AdminAuditInput): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: opts.adminId,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        previousValue: opts.previousValue as Prisma.InputJsonValue | undefined,
        newValue: opts.newValue as Prisma.InputJsonValue | undefined,
        meta: opts.meta as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error("admin audit log failed", e);
  }
}
