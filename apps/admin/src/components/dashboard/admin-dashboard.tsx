import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDashboard } from "@/api/dashboard/hooks";
import { ActivityFeed } from "./activity-feed";
import { CompatibilityHealth } from "./compatibility-health";
import { DashboardHeader } from "./dashboard-header";
import { KpiStrip } from "./kpi-strip";
import { LeadsWidget } from "./leads-widget";
import { OperationalWidgets } from "./operational-widgets";
import { RecentOrdersTable } from "./recent-orders-table";
import { RevenueAnalytics } from "./revenue-analytics";

export function AdminDashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard();

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-gradient-to-b from-stone-50/50 to-white">
      <DashboardHeader
        brand={
          data?.brand ?? {
            name: "Tread Trails India",
            tagline: "Premium 4×4 aftermarket operations",
          }
        }
        generatedAt={data?.generatedAt}
        onRefresh={() => void refetch()}
        isRefreshing={isFetching}
      />

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load dashboard"}
          </AlertDescription>
        </Alert>
      )}

      <KpiStrip kpis={data?.kpis} isLoading={isLoading} />
      <RevenueAnalytics analytics={data?.analytics} isLoading={isLoading} />
      <OperationalWidgets operational={data?.operational} isLoading={isLoading} />
      <RecentOrdersTable
        orders={data?.recentOrders ?? []}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">
        <div className="xl:col-span-7">
          <LeadsWidget leads={data?.leads ?? []} isLoading={isLoading} />
        </div>
        <div className="xl:col-span-5">
          <CompatibilityHealth
            compatibility={data?.compatibility}
            isLoading={isLoading}
          />
        </div>
      </div>

      <ActivityFeed activity={data?.activity ?? []} isLoading={isLoading} />
    </div>
  );
}
