import { Suspense } from "react";

import { AdminCrmPanel } from "@/components/admin/admin-crm-panel";

export default function AdminCrmPage() {
  return (
    <Suspense fallback={null}>
      <AdminCrmPanel />
    </Suspense>
  );
}
