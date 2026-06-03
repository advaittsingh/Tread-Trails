import { useState } from "react";
import { useAdminQuery } from "@/api/admin";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";

type ErrorsResponse = {
  errors: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
  severityCounts: Record<string, number>;
};

const SEVERITIES = ["all", "debug", "info", "warn", "error", "fatal"] as const;

export default function SystemErrorsPage() {
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  const q = useAdminQuery<ErrorsResponse>("/api/admin/errors", {
    page,
    limit: 25,
    severity: severity === "all" ? undefined : severity,
    route: searchInput || undefined,
  });

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap gap-3">
          <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All severities" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="max-w-xs"
            placeholder="Search route…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </CardContent>

      <AdminDataTable
        rows={q.data?.errors ?? []}
        columns={[
          { key: "severity", label: "Severity" },
          { key: "category", label: "Category" },
          { key: "source", label: "Source" },
          { key: "route", label: "Route" },
          { key: "message", label: "Message" },
          { key: "createdAt", label: "When" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No errors found."}
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
