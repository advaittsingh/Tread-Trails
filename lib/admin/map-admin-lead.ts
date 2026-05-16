import type { Lead, LeadEmailLog, User } from "@prisma/client";

import type {
  AdminLeadDetail,
  AdminLeadEmailLog,
  LeadTimelineEvent,
} from "@/lib/admin/lead-detail";

type LeadWithAssignee = Lead & {
  assignedTo: Pick<User, "id" | "name" | "email"> | null;
};

type EmailLogWithAdmin = LeadEmailLog & {
  admin: Pick<User, "name"> | null;
};

export function mapAdminLeadListRow(lead: LeadWithAssignee) {
  return {
    id: lead.id,
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    displayName: lead.displayName,
    email: lead.email,
    phone: lead.phone,
    subject: lead.subject,
    companyName: lead.companyName,
    assignedToName: lead.assignedTo?.name ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function mapAdminLeadDetail(lead: LeadWithAssignee): AdminLeadDetail {
  return {
    id: lead.id,
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    displayName: lead.displayName,
    email: lead.email,
    phone: lead.phone,
    subject: lead.subject,
    message: lead.message,
    companyName: lead.companyName,
    contactPerson: lead.contactPerson,
    businessType: lead.businessType,
    requirements: lead.requirements,
    adminNotes: lead.adminNotes,
    assignedTo: lead.assignedTo
      ? {
          id: lead.assignedTo.id,
          name: lead.assignedTo.name,
          email: lead.assignedTo.email,
        }
      : null,
    inboxSubmissionId: lead.inboxSubmissionId,
    contactedAt: lead.contactedAt?.toISOString() ?? null,
    qualifiedAt: lead.qualifiedAt?.toISOString() ?? null,
    convertedAt: lead.convertedAt?.toISOString() ?? null,
    closedAt: lead.closedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function mapLeadEmailLogs(logs: EmailLogWithAdmin[]): AdminLeadEmailLog[] {
  return logs.map((log) => ({
    id: log.id,
    to: log.to,
    subject: log.subject,
    template: log.template,
    bodyPreview: log.bodyPreview,
    provider: log.provider,
    sentByName: log.admin?.name ?? null,
    createdAt: log.createdAt.toISOString(),
  }));
}

export function mapLeadTimeline(
  lead: Lead,
  emailLogs: LeadEmailLog[]
): LeadTimelineEvent[] {
  const events: LeadTimelineEvent[] = [
    {
      id: "created",
      kind: "created",
      title: "Lead created",
      detail: lead.source === "corporate" ? "Corporate inquiry" : "Contact form",
      at: lead.createdAt.toISOString(),
    },
  ];

  if (lead.contactedAt) {
    events.push({
      id: "contacted",
      kind: "status",
      title: "Marked contacted",
      at: lead.contactedAt.toISOString(),
    });
  }
  if (lead.qualifiedAt) {
    events.push({
      id: "qualified",
      kind: "status",
      title: "Qualified",
      at: lead.qualifiedAt.toISOString(),
    });
  }
  if (lead.convertedAt) {
    events.push({
      id: "converted",
      kind: "status",
      title: "Converted",
      at: lead.convertedAt.toISOString(),
    });
  }
  if (lead.closedAt) {
    events.push({
      id: "closed",
      kind: "status",
      title: "Closed",
      at: lead.closedAt.toISOString(),
    });
  }

  for (const log of emailLogs) {
    events.push({
      id: `email-${log.id}`,
      kind: "email",
      title: `Email: ${log.subject}`,
      detail: log.template ?? undefined,
      at: log.createdAt.toISOString(),
    });
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return events;
}
