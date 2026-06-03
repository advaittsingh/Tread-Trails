import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { InboxKind, LeadStatus } from "@prisma/client";
import { z } from "zod";

import { logAdminAction } from "../../lib/admin/admin-audit.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { adminId, pagination, validationError } from "./utils.js";

const patchSchema = z.object({
  read: z.boolean().optional(),
});

export async function listInbox(req: Request, res: Response) {
  const { page, limit, skip } = pagination(req);
  const kindParam = String(req.query.kind ?? "").trim();
  const unreadOnly = req.query.unread === "1";

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
        include: { lead: { select: { id: true, status: true } } },
      }),
      prisma.inboxSubmission.count({ where }),
    ]);

    return res.json({
      submissions: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load inbox" });
  }
}

export async function patchInbox(req: AuthedRequest, res: Response) {
  const id = req.params.id as string;
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const data: { readAt?: Date | null } = {};
  if (parsed.data.read === true) data.readAt = new Date();
  if (parsed.data.read === false) data.readAt = null;

  try {
    const row = await prisma.inboxSubmission.update({
      where: { id },
      data,
    });

    if (parsed.data.read === true) {
      const linked = await prisma.lead.findFirst({
        where: { inboxSubmissionId: id },
      });
      if (linked && linked.status === LeadStatus.new) {
        await prisma.lead.update({
          where: { id: linked.id },
          data: {
            status: LeadStatus.contacted,
            contactedAt: new Date(),
          },
        });
      }
    }

    await logAdminAction({
      adminId: adminId(req),
      action: parsed.data.read ? "inbox.mark_read" : "inbox.mark_unread",
      entity: "inbox_submission",
      entityId: id,
    });

    return res.json({ submission: row });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Update failed" });
  }
}
