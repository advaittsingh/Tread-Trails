import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";

import { requireAdminSession } from "@/lib/auth/admin-session";

import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
