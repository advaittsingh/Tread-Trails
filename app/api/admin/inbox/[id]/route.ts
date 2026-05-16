import { NextResponse } from "next/server";
import { z } from "zod";

import { LeadStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth/request-user";
import { logAdminAction } from "@/lib/server/admin-audit";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  read: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data: { readAt?: Date | null } = {};
  if (parsed.data.read === true) data.readAt = new Date();
  if (parsed.data.read === false) data.readAt = null;

  try {
    const row = await prisma.inboxSubmission.update({
      where: { id: context.params.id },
      data,
    });

    if (parsed.data.read === true) {
      const linked = await prisma.lead.findFirst({
        where: { inboxSubmissionId: context.params.id },
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
      adminId: gate.auth.userId,
      action: parsed.data.read ? "inbox.mark_read" : "inbox.mark_unread",
      entity: "inbox_submission",
      entityId: context.params.id,
    });

    return NextResponse.json({ submission: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
