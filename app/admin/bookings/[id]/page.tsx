import { AdminBookingDetailPage } from "@/components/admin/admin-booking-detail-page";

export default function AdminBookingDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  return <AdminBookingDetailPage bookingId={params.id} />;
}
