import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logAppError(opts: {
  source: string;
  message: string;
  detail?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.appErrorLog.create({
      data: {
        source: opts.source,
        message: opts.message.slice(0, 2000),
        detail: opts.detail?.slice(0, 8000),
        meta: opts.meta as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    console.error("app error log failed", e);
  }
}
