import { useAdminQuery } from "@/api/admin";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default function VehiclesPage() {
  const q = useAdminQuery<{ vehicles?: any[] }>("/api/admin/vehicles");
  const rows = (q.data?.vehicles ?? []) as Record<string, unknown>[];

  return (
    <>
      <AdminDataTable
        rows={rows}
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "category", label: "Category" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No vehicles."}
      />
      {q.error ? (
        <div className="px-3 lg:px-6 pb-6 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : null}
    </>
  );
}

