"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

import type {
  AdminLeadDetail,
  AdminLeadEmailLog,
  LeadTimelineEvent,
} from "@/lib/admin/lead-detail";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import {
  AdminFormSection,
  adminTextareaClass,
} from "@/components/admin/admin-form-ui";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type Assignee = { id: string; name: string; email: string };

type PatchBody = {
  status?: string;
  priority?: string;
  adminNotes?: string;
  assignedToId?: string | null;
};

type Props = { leadId: string };

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "closed",
] as const;

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

const EMAIL_TEMPLATES = [
  { id: "interest", label: "Inquiry received" },
  { id: "follow_up", label: "Follow up" },
  { id: "qualified_next_steps", label: "Qualified — next steps" },
  { id: "thank_you", label: "Thank you" },
] as const;

export function AdminLeadDetailPage({ leadId }: Props) {
  const [lead, setLead] = useState<AdminLeadDetail | null>(null);
  const [timeline, setTimeline] = useState<LeadTimelineEvent[]>([]);
  const [emailHistory, setEmailHistory] = useState<AdminLeadEmailLog[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("follow_up");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadRes, assigneeRes] = await Promise.all([
        fetch(`/api/admin/leads/${leadId}`, { credentials: "include" }),
        fetch("/api/admin/leads/assignees", { credentials: "include" }),
      ]);
      const data = await leadRes.json();
      if (!leadRes.ok) throw new Error(data.error ?? "Failed");
      const l = data.lead as AdminLeadDetail;
      setLead(l);
      setAdminNotes(l.adminNotes ?? "");
      setTimeline((data.timeline as LeadTimelineEvent[]) ?? []);
      setEmailHistory((data.emailHistory as AdminLeadEmailLog[]) ?? []);

      if (assigneeRes.ok) {
        const a = await assigneeRes.json();
        setAssignees((a.assignees as Assignee[]) ?? []);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setLead(null);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchLead = useCallback(
    async (body: PatchBody, successMessage: string) => {
      if (!lead) return false;
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/leads/${leadId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Update failed");
        setLead(data.lead as AdminLeadDetail);
        setTimeline((data.timeline as LeadTimelineEvent[]) ?? []);
        if (data.emailHistory) {
          setEmailHistory(data.emailHistory as AdminLeadEmailLog[]);
        }
        toastSuccess(successMessage);
        return true;
      } catch (e) {
        toastError(
          "Update failed",
          e instanceof Error ? e.message : "Error"
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [lead, leadId]
  );

  async function sendEmail() {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: emailTemplate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setLead(data.lead as AdminLeadDetail);
      setEmailHistory((data.emailHistory as AdminLeadEmailLog[]) ?? []);
      toastSuccess("Email sent", data.provider ? `via ${data.provider}` : undefined);
    } catch (e) {
      toastError(
        "Could not send email",
        e instanceof Error ? e.message : "Error"
      );
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
        <Skeleton className="h-8 w-48 rounded-lg bg-zinc-800" />
        <Skeleton className="h-48 w-full rounded-2xl bg-zinc-800" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
        <Link
          href="/admin/leads"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Back to leads
        </Link>
        <p className="text-rose-300">{error ?? "Lead not found"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 lg:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <Link
            href="/admin/leads"
            className="mb-3 inline-flex items-center text-sm text-zinc-400 hover:text-zinc-200"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Leads
          </Link>
          <h1 className="font-heading text-2xl tracking-tight text-white">
            {lead.displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-400 capitalize">
            {lead.source} lead · {new Date(lead.createdAt).toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminStatusBadge status={lead.status} />
            <AdminStatusBadge status={lead.priority} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminFormSection title="Inquiry">
            {lead.source === "corporate" ? (
              <div className="space-y-3 text-sm text-zinc-300">
                <p className="flex items-center gap-2">
                  <Building2 className="size-4 text-zinc-500" />
                  {lead.companyName}
                </p>
                <p>Contact: {lead.contactPerson}</p>
                <p>Business: {lead.businessType}</p>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-400">
                  {lead.requirements}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-zinc-300">
                <p className="font-medium text-zinc-100">{lead.subject}</p>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-400">
                  {lead.message}
                </p>
              </div>
            )}
          </AdminFormSection>

          <AdminFormSection title="Pipeline">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-500">Status</Label>
                <select
                  value={lead.status}
                  disabled={saving}
                  onChange={(e) =>
                    void patchLead({ status: e.target.value }, "Status updated")
                  }
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500">Priority</Label>
                <select
                  value={lead.priority}
                  disabled={saving}
                  onChange={(e) =>
                    void patchLead(
                      { priority: e.target.value },
                      "Priority updated"
                    )
                  }
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-zinc-500">Assigned to</Label>
                <select
                  value={lead.assignedTo?.id ?? ""}
                  disabled={saving}
                  onChange={(e) =>
                    void patchLead(
                      {
                        assignedToId: e.target.value || null,
                      },
                      "Assignment updated"
                    )
                  }
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </AdminFormSection>

          <AdminFormSection title="Admin notes">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={5}
              className={adminTextareaClass}
              placeholder="Internal notes — fitment context, follow-up promises…"
            />
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className="mt-3"
              onClick={() => void patchLead({ adminNotes }, "Notes saved")}
            >
              Save notes
            </Button>
          </AdminFormSection>

          <AdminFormSection title="Send email">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label className="text-zinc-500">Template</Label>
                <select
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
                >
                  {EMAIL_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                disabled={sendingEmail}
                onClick={() => void sendEmail()}
                className="bg-brand-maroon-light hover:bg-brand-maroon"
              >
                {sendingEmail ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                Send to {lead.email}
              </Button>
            </div>
          </AdminFormSection>

          <AdminFormSection title="Email history">
            {emailHistory.length === 0 ? (
              <p className="text-sm text-zinc-500">No outbound emails yet.</p>
            ) : (
              <ul className="space-y-3">
                {emailHistory.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-zinc-100">{log.subject}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                      {log.sentByName ? ` · ${log.sentByName}` : ""}
                      {log.template ? ` · ${log.template}` : ""}
                      {log.provider ? ` · ${log.provider}` : ""}
                    </p>
                    {log.bodyPreview ? (
                      <p className="mt-2 text-xs text-zinc-400">{log.bodyPreview}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminFormSection>
        </div>

        <div className="space-y-6">
          <AdminFormSection title="Contact">
            <div className="space-y-3 text-sm">
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2 text-brand-gold-dark hover:underline"
              >
                <Mail className="size-4" />
                {lead.email}
              </a>
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 text-zinc-300 hover:text-white"
                >
                  <Phone className="size-4 text-zinc-500" />
                  {lead.phone}
                </a>
              ) : null}
            </div>
          </AdminFormSection>

          <AdminFormSection title="Timeline">
            <ul className="space-y-4 border-l border-zinc-800 pl-4">
              {timeline.map((ev) => (
                <li key={ev.id} className="relative text-sm">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-2 ring-zinc-950",
                      ev.kind === "email"
                        ? "bg-sky-500"
                        : ev.kind === "status"
                          ? "bg-violet-500"
                          : "bg-zinc-500"
                    )}
                  />
                  <p className="font-medium text-zinc-200">{ev.title}</p>
                  {ev.detail ? (
                    <p className="text-xs text-zinc-500">{ev.detail}</p>
                  ) : null}
                  <p className="text-[10px] text-zinc-600">
                    {new Date(ev.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </AdminFormSection>

          {lead.inboxSubmissionId ? (
            <p className="text-xs text-zinc-600">
              <MessageSquare className="mr-1 inline size-3.5" />
              Linked inbox submission
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
