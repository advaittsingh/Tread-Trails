import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ClipboardList,
  Package,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardActivity } from "@/api/dashboard/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS: Record<string, typeof ShoppingCart> = {
  "Order Created": ShoppingCart,
  "Order Updated": ClipboardList,
  "Product Updated": Package,
  "Lead Assigned": UserPlus,
  "Lead Updated": UserPlus,
  "Booking Confirmed": CalendarCheck,
  "Booking Updated": CalendarCheck,
};

function activityIcon(type: string) {
  return ACTIVITY_ICONS[type] ?? ClipboardList;
}

export function ActivityFeed({
  activity,
  isLoading,
}: {
  activity: DashboardActivity[];
  isLoading?: boolean;
}) {
  return (
    <Card className="border-stone-200 shadow-none h-full">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
          <Link to="/system/audit">Audit log</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-stone-500">No recent admin activity.</p>
        ) : (
          <ul className="space-y-0 divide-y divide-stone-100 max-h-[320px] overflow-y-auto custom-scrollbar">
            {activity.map((item, idx) => {
              const Icon = activityIcon(item.type);
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex gap-3 py-2.5",
                    idx === 0 && "pt-0"
                  )}
                >
                  <div className="h-8 w-8 shrink-0 rounded-md bg-stone-100 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-stone-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {item.type}
                    </p>
                    <p className="text-xs text-stone-500 truncate">{item.detail}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {item.actor} · {formatShortDate(item.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
