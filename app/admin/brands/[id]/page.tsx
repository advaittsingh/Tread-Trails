import { AdminBrandForm } from "@/components/admin/forms/admin-brand-form";

export default function AdminEditBrandPage({
  params,
}: {
  params: { id: string };
}) {
  return <AdminBrandForm recordId={params.id} />;
}
