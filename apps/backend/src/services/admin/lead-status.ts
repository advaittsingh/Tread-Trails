import type { Lead, Prisma } from "@prisma/client";
import { LeadStatus } from "@prisma/client";

export function leadStatusTimestampPatch(
  nextStatus: LeadStatus,
  prev: Lead
): Prisma.LeadUpdateInput {
  const now = new Date();
  const patch: Prisma.LeadUpdateInput = { status: nextStatus };

  if (nextStatus === LeadStatus.contacted && !prev.contactedAt) {
    patch.contactedAt = now;
  }
  if (nextStatus === LeadStatus.qualified && !prev.qualifiedAt) {
    patch.qualifiedAt = now;
  }
  if (nextStatus === LeadStatus.converted && !prev.convertedAt) {
    patch.convertedAt = now;
  }
  if (nextStatus === LeadStatus.closed && !prev.closedAt) {
    patch.closedAt = now;
  }

  return patch;
}
