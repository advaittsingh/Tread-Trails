import { useAdminQuery } from "@/api/admin";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default function BookingsPage() {
  const q = useAdminQuery<{ bookings?: any[] }>("/api/admin/bookings");
  const rows = (q.data?.bookings ?? []) as Record<string, unknown>[];

  return (
    <>
      <AdminDataTable
        rows={rows}
        columns={[
          { key: "id", label: "ID" },
          { key: "status", label: "Status" },
          { key: "vehicleSlug", label: "Vehicle" },
          { key: "createdAt", label: "Created" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No bookings."}
      />
      {q.error ? (
        <div className="px-3 lg:px-6 pb-6 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : null}
    </>
  );
}

