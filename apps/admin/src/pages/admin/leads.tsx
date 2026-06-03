import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type LeadRow = {
  id: string;
  displayName: string;
  email: string;
  status: string;
  priority: string;
  source: string;
  assignedToName: string | null;
  createdAt: string;
};

type LeadsResponse = {
  leads: LeadRow[];
  total: number;
  page: number;
  totalPages: number;
};

type LeadDetailResponse = {
  lead: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    status: string;
    priority: string;
    source: string;
    subject: string | null;
    message: string | null;
    companyName: string | null;
    adminNotes: string | null;
    assignedTo: { id: string; name: string; email: string } | null;
  };
  emailHistory: Array<{
    id: string;
    subject: string;
    template: string;
    sentByName: string | null;
    createdAt: string;
  }>;
  timeline: Array<{ id: string; title: string; detail?: string; at: string }>;
};

const STATUSES = ["new", "contacted", "qualified", "converted", "closed"];
const EMAIL_TEMPLATES = [
  { id: "interest", label: "Interest" },
  { id: "follow_up", label: "Follow up" },
  { id: "qualified_next_steps", label: "Qualified next steps" },
  { id: "thank_you", label: "Thank you" },
] as const;

export default function LeadsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [emailTemplate, setEmailTemplate] = useState<string>("follow_up");

  const listQ = useAdminQuery<LeadsResponse>("/api/admin/leads", {
    page,
    limit: 25,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const assigneesQ = useAdminQuery<{ assignees: Array<{ id: string; name: string }> }>(
    "/api/admin/leads/assignees"
  );

  const detailQ = useAdminQuery<LeadDetailResponse>(
    selectedId ? `/api/admin/leads/${selectedId}` : "",
    undefined,
    { enabled: Boolean(selectedId) }
  );

  const patchMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchJson(`/api/admin/leads/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Lead updated" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const emailMut = useMutation({
    mutationFn: (template: string) =>
      apiFetchJson(`/api/admin/leads/${selectedId}/email`, {
        method: "POST",
        body: JSON.stringify({ template }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Email sent" });
    },
    onError: (e: Error) => toast({ title: "Email failed", description: e.message, variant: "destructive" }),
  });

  const lead = detailQ.data?.lead;

  useEffect(() => {
    if (lead) setNotes(lead.adminNotes ?? "");
  }, [lead?.id, lead?.adminNotes]);

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search leads…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <AdminDataTable
        rows={(listQ.data?.leads ?? []) as Record<string, unknown>[]}
        columns={[
          { key: "displayName", label: "Name" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status" },
          { key: "priority", label: "Priority" },
          { key: "source", label: "Source" },
          { key: "assignedToName", label: "Assigned" },
          { key: "createdAt", label: "Created" },
        ]}
        emptyText={listQ.isLoading ? "Loading…" : "No leads."}
        onRowClick={(row) => setSelectedId(String(row.id))}
      />

      {listQ.data ? (
        <AdminPagination
          page={listQ.data.page}
          totalPages={listQ.data.totalPages}
          total={listQ.data.total}
          onPageChange={setPage}
        />
      ) : null}

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{lead?.displayName ?? "Lead details"}</SheetTitle>
          </SheetHeader>

          {detailQ.isLoading ? (
            <p className="text-sm text-stone-600 mt-4">Loading…</p>
          ) : lead ? (
            <div className="mt-6 space-y-6">
              <div className="space-y-2 text-sm">
                <p><span className="text-stone-500">Email:</span> {lead.email}</p>
                {lead.phone ? <p><span className="text-stone-500">Phone:</span> {lead.phone}</p> : null}
                {lead.subject ? <p><span className="text-stone-500">Subject:</span> {lead.subject}</p> : null}
                {lead.message ? (
                  <p className="whitespace-pre-wrap border rounded-md p-3 bg-stone-50">{lead.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={lead.status}
                  onValueChange={(v) => patchMut.mutate({ status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign to</Label>
                <Select
                  value={lead.assignedTo?.id ?? "unassigned"}
                  onValueChange={(v) =>
                    patchMut.mutate({ assignedToId: v === "unassigned" ? null : v })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(assigneesQ.data?.assignees ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button
                  size="sm"
                  onClick={() => patchMut.mutate({ adminNotes: notes })}
                  disabled={patchMut.isPending}
                >
                  Save notes
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Email lead</Label>
                <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMAIL_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => emailMut.mutate(emailTemplate)}
                  disabled={emailMut.isPending}
                >
                  Send email
                </Button>
              </div>

              {detailQ.data?.emailHistory.length ? (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Email history</h3>
                  <ul className="space-y-2 text-sm">
                    {detailQ.data.emailHistory.map((e) => (
                      <li key={e.id} className="border rounded p-2">
                        <Badge variant="secondary">{e.template}</Badge>
                        <p>{e.subject}</p>
                        <p className="text-stone-500 text-xs">{e.createdAt}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
