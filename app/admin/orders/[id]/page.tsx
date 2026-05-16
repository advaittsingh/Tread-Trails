import { AdminOrderDetailPage } from "@/components/admin/admin-order-detail-page";

export default function AdminOrderDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  return <AdminOrderDetailPage orderId={params.id} />;
}
