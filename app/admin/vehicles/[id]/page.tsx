import { AdminVehicleForm } from "@/components/admin/forms/admin-vehicle-form";

export default function AdminEditVehiclePage({
  params,
}: {
  params: { id: string };
}) {
  return <AdminVehicleForm recordId={params.id} />;
}
