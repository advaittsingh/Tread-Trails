import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminQuery } from "@/api/admin";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

type UsersResponse = {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const q = useAdminQuery<UsersResponse>("/api/admin/users", {
    page,
    limit: 25,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const rows = (q.data?.users ?? []).map((u) => ({
    ...u,
    idShort: u.id.slice(0, 8) + "…",
    roleLabel: u.role,
    statusLabel: u.status,
    createdFmt: formatDate(u.createdAt),
  }));

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            placeholder="Search name, email, ID…"
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <AdminDataTable
        rows={rows}
        columns={[
          { key: "idShort", label: "ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "roleLabel", label: "Role" },
          { key: "statusLabel", label: "Status" },
          { key: "createdFmt", label: "Joined" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No users."}
        onRowClick={(row) => navigate(`/users/${String(row.id)}`)}
      />

      {q.data ? (
        <AdminPagination
          page={q.data.page}
          totalPages={q.data.totalPages}
          total={q.data.total}
          onPageChange={setPage}
        />
      ) : null}

      {q.error ? (
        <div className="px-3 lg:px-6 pb-6 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : null}
    </>
  );
}
