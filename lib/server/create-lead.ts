import type { Lead, Prisma } from "@prisma/client";
import { LeadPriority, LeadSource, LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ContactLeadInput = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  inboxSubmissionId?: string;
};

export type CorporateLeadInput = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  requirements: string;
  inboxSubmissionId?: string;
};

export async function createLeadFromContact(
  input: ContactLeadInput
): Promise<Lead> {
  return prisma.lead.create({
    data: {
      source: LeadSource.contact,
      status: LeadStatus.new,
      priority: LeadPriority.normal,
      displayName: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim() || null,
      subject: input.subject.trim(),
      message: input.message.trim(),
      inboxSubmissionId: input.inboxSubmissionId ?? null,
    },
  });
}

export async function createLeadFromCorporate(
  input: CorporateLeadInput
): Promise<Lead> {
  return prisma.lead.create({
    data: {
      source: LeadSource.corporate,
      status: LeadStatus.new,
      priority: LeadPriority.high,
      displayName: input.companyName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim() || null,
      companyName: input.companyName.trim(),
      contactPerson: input.contactPerson.trim(),
      businessType: input.businessType,
      requirements: input.requirements.trim(),
      inboxSubmissionId: input.inboxSubmissionId ?? null,
    },
  });
}

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
