import { AdminProductForm } from "@/components/admin/forms/admin-product-form";

export default function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  return <AdminProductForm recordId={params.id} />;
}
