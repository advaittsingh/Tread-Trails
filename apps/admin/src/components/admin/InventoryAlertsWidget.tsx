import { Link } from "react-router-dom";
import { useAdminQuery } from "@/api/admin";
import { AdminStatusCard } from "@/components/admin/AdminStatusCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InventoryAlert = {
  productId: string;
  name: string;
  sku: string;
  available: number;
  threshold: number;
};

type StatsInventory = {
  lowStockCount: number;
  outOfStockCount: number;
  alerts: InventoryAlert[];
};

export function InventoryAlertsWidget() {
  const statsQ = useAdminQuery<{ inventory?: StatsInventory | null }>(
    "/api/admin/stats"
  );
  const dashQ = useAdminQuery<{
    lowStockCount: number;
    outOfStockCount: number;
    alerts: InventoryAlert[];
  }>("/api/admin/inventory/dashboard");

  const inv = dashQ.data ?? statsQ.data?.inventory;
  const alerts = inv?.alerts ?? [];

  return (
    <Card className="border-stone-200 mb-8">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Low stock alerts</CardTitle>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/inventory">View inventory</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <AdminStatusCard
            title="Low stock"
            ok={(inv?.lowStockCount ?? 0) === 0}
            detail={`${inv?.lowStockCount ?? 0} products below threshold`}
          />
          <AdminStatusCard
            title="Out of stock"
            ok={(inv?.outOfStockCount ?? 0) === 0}
            detail={`${inv?.outOfStockCount ?? 0} products unavailable`}
          />
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-stone-600">No low stock alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <li
                key={a.productId}
                className="flex items-center justify-between text-sm border border-stone-200 rounded-md px-3 py-2"
              >
                <span>{a.name}</span>
                <Badge variant="destructive">
                  {a.available} / {a.threshold}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
