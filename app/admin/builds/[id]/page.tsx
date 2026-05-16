import { AdminBuildForm } from "@/components/admin/forms/admin-build-form";

export default function AdminEditBuildPage({
  params,
}: {
  params: { id: string };
}) {
  return <AdminBuildForm recordId={params.id} />;
}
