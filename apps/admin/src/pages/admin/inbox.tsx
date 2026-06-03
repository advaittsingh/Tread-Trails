import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type Submission = {
  id: string;
  kind: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
  lead: { id: string; status: string } | null;
};

type InboxResponse = {
  submissions: Submission[];
  total: number;
  page: number;
  totalPages: number;
};

export default function InboxPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Submission | null>(null);

  const q = useAdminQuery<InboxResponse>("/api/admin/inbox", {
    page,
    limit: 25,
    kind: kind === "all" ? undefined : kind,
    unread: unreadOnly ? "1" : undefined,
  });

  const patchMut = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      apiFetchJson(`/api/admin/inbox/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ read }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const visible =
    q.data?.submissions.filter((s) => !archived.has(s.id)) ?? [];

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap gap-3">
          <Select value={kind} onValueChange={(v) => { setKind(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={unreadOnly ? "default" : "secondary"}
            size="sm"
            onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}
          >
            Unread only
          </Button>
        </div>
      </CardContent>

      <CardContent className="px-3 lg:px-6 pb-6 space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-stone-600">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-stone-600">No messages.</p>
        ) : (
          visible.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                setSelected(sub);
                if (!sub.readAt) patchMut.mutate({ id: sub.id, read: true });
              }}
              className="w-full text-left rounded-lg border border-stone-200 p-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-stone-900">{sub.name}</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">{sub.kind}</Badge>
                  {!sub.readAt ? <Badge>Unread</Badge> : null}
                </div>
              </div>
              <p className="text-sm text-stone-600 truncate">{sub.subject ?? sub.message}</p>
              <p className="text-xs text-stone-500 mt-1">{sub.createdAt}</p>
            </button>
          ))
        )}
      </CardContent>

      {q.data ? (
        <AdminPagination
          page={q.data.page}
          totalPages={q.data.totalPages}
          total={q.data.total}
          onPageChange={setPage}
        />
      ) : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.subject ?? "Message"}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <p><span className="text-stone-500">From:</span> {selected.name} ({selected.email})</p>
                {selected.phone ? <p><span className="text-stone-500">Phone:</span> {selected.phone}</p> : null}
                <p className="whitespace-pre-wrap border rounded-md p-3 bg-stone-50">{selected.message}</p>

                {selected.lead ? (
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/leads" onClick={() => setSelected(null)}>
                      View linked lead ({selected.lead.status})
                    </Link>
                  </Button>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      patchMut.mutate({ id: selected.id, read: false });
                      toast({ title: "Marked unread" });
                    }}
                  >
                    Mark unread
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setArchived((prev) => new Set(prev).add(selected.id));
                      patchMut.mutate({ id: selected.id, read: true });
                      setSelected(null);
                      toast({ title: "Archived" });
                    }}
                  >
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      patchMut.mutate({ id: selected.id, read: true });
                      toast({ title: "Marked resolved" });
                      setSelected(null);
                    }}
                  >
                    Mark resolved
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
