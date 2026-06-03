import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardLeadRow } from "@/api/dashboard/types";
import { formatShortDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

export function LeadsWidget({
  leads,
  isLoading,
}: {
  leads: DashboardLeadRow[];
  isLoading?: boolean;
}) {
  return (
    <Card className="border-stone-200 shadow-none h-full">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-semibold">Lead pipeline</CardTitle>
        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
          <Link to="/leads">CRM</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {isLoading ? (
          <div className="px-4 space-y-2 pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-stone-500 px-4 pb-4">No leads in pipeline.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-stone-100 bg-stone-50/80 text-left">
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    Name
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    Vehicle
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 min-w-[140px]">
                    Inquiry
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-stone-50 hover:bg-stone-50/80"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-medium text-stone-900 hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {formatShortDate(lead.createdAt)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-stone-600 text-xs max-w-[100px] truncate">
                      {lead.vehicle}
                    </td>
                    <td className="px-3 py-2.5 text-stone-600 text-xs line-clamp-2 max-w-[200px]">
                      {lead.inquiry}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
