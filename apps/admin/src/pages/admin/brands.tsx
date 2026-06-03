import { useAdminQuery } from "@/api/admin";
import { AdminDataTable } from "@/components/admin/AdminDataTable";

export default function BrandsPage() {
  const q = useAdminQuery<{ brands?: any[] }>("/api/admin/brands");
  const rows = (q.data?.brands ?? []) as Record<string, unknown>[];

  return (
    <>
      <AdminDataTable
        rows={rows}
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "productCount", label: "Products" },
        ]}
        emptyText={q.isLoading ? "Loading…" : "No brands."}
      />
      {q.error ? (
        <div className="px-3 lg:px-6 pb-6 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : null}
    </>
  );
}

