import { AdminLeadDetailPage } from "@/components/admin/admin-lead-detail-page";

type Props = { params: { id: string } };

export default function AdminLeadDetailRoute({ params }: Props) {
  return <AdminLeadDetailPage leadId={params.id} />;
}
