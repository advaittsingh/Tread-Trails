import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const AdminAnalyticsDashboard = dynamic(
  () =>
    import("@/components/admin/admin-analytics-dashboard").then((m) => ({
      default: m.AdminAnalyticsDashboard,
    })),
  {
    loading: () => (
      <div className="space-y-8 p-6 lg:p-10">
        <div className="space-y-3 border-b border-zinc-800 pb-6">
          <Skeleton className="h-4 w-40 rounded-md bg-zinc-800" />
          <Skeleton className="h-9 w-72 rounded-lg bg-zinc-800" />
          <Skeleton className="h-5 max-w-xl rounded-md bg-zinc-800" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/80" />
          ))}
        </div>
        <Skeleton className="h-[320px] rounded-2xl border border-zinc-800 bg-zinc-900/80" />
      </div>
    ),
  }
);

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsDashboard />;
}
