import { useState } from "react";
import { useAdminQuery } from "@/api/admin";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Input } from "@/components/ui/input";
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

type AuditRow = {
  id: string;
  adminId: string;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousSummary: string;
  newSummary: string;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditRow[];
  total: number;
  page: number;
  totalPages: number;
};

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "product", label: "Products" },
  { value: "inventory", label: "Inventory" },
  { value: "user", label: "Users" },
  { value: "order", label: "Orders" },
  { value: "cms", label: "CMS" },
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function SystemAuditPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [action, setAction] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const q = useAdminQuery<AuditResponse>("/api/admin/audit", {
    page,
    limit: 25,
    category: category === "all" ? undefined : category,
    action: action || undefined,
    search: userSearch || undefined,
  });

  const rows = (q.data?.logs ?? []).map((row) => ({
    ...row,
    userLabel: row.adminName ?? row.adminEmail ?? row.adminId.slice(0, 8) + "…",
    when: formatWhen(row.createdAt),
    prevShort: row.previousSummary.slice(0, 80),
    newShort: row.newSummary.slice(0, 80),
  }));

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search user, action, entity…"
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Action filter"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </CardContent>

      <AdminDataTable
        rows={rows}
        columns={[
          { key: "when", label: "Timestamp" },
          { key: "userLabel", label: "User" },
          { key: "action", label: "Action" },
          { key: "entity", label: "Entity" },
          { key: "entityId", label: "Entity ID" },
          { key: "prevShort", label: "Previous" },
          { key: "newShort", label: "New" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No audit entries."}
        onRowClick={(row) => setSelected(row as AuditRow)}
      />

      {q.data ? (
        <AdminPagination
          page={q.data.page}
          totalPages={q.data.totalPages}
          total={q.data.total}
          onPageChange={setPage}
        />
      ) : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.action}</SheetTitle>
          </SheetHeader>
          {selected ? (
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-stone-500">User</p>
                <p>{selected.adminName ?? selected.adminEmail ?? selected.adminId}</p>
              </div>
              <div>
                <p className="text-stone-500">Timestamp</p>
                <p>{formatWhen(selected.createdAt)}</p>
              </div>
              <div>
                <p className="text-stone-500">Entity</p>
                <p>
                  {selected.entity} · {selected.entityId}
                </p>
              </div>
              <div>
                <p className="text-stone-500 mb-1">Previous value</p>
                <pre className="text-xs rounded-md bg-stone-100 p-3 overflow-auto whitespace-pre-wrap">
                  {selected.previousSummary || "—"}
                </pre>
              </div>
              <div>
                <p className="text-stone-500 mb-1">New value</p>
                <pre className="text-xs rounded-md bg-stone-100 p-3 overflow-auto whitespace-pre-wrap">
                  {selected.newSummary || "—"}
                </pre>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {q.error ? (
        <div className="px-3 lg:px-6 pb-6 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : null}
    </>
  );
}
