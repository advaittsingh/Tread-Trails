import type { LeadStatus, LeadPriority, LeadSource } from "@prisma/client";

export type LeadTimelineEvent = {
  id: string;
  kind: "created" | "status" | "email" | "admin";
  title: string;
  detail?: string;
  at: string;
};

export type AdminLeadEmailLog = {
  id: string;
  to: string;
  subject: string;
  template: string | null;
  bodyPreview: string | null;
  provider: string | null;
  sentByName: string | null;
  createdAt: string;
};

export type AdminLeadAssignee = {
  id: string;
  name: string;
  email: string;
};

export type AdminLeadDetail = {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  displayName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  companyName: string | null;
  contactPerson: string | null;
  businessType: string | null;
  requirements: string | null;
  adminNotes: string;
  assignedTo: AdminLeadAssignee | null;
  inboxSubmissionId: string | null;
  contactedAt: string | null;
  qualifiedAt: string | null;
  convertedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
