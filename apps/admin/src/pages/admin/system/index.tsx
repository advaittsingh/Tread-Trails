import { Link } from "react-router-dom";
import { useAdminQuery } from "@/api/admin";
import { AdminStatusCard } from "@/components/admin/AdminStatusCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

type SystemResponse = {
  postgresConfigured: boolean;
  postgresOk: boolean;
  postgresLatencyMs: number | null;
  stripeConfigured: boolean;
  webhookConfigured: boolean;
  resendConfigured: boolean;
  razorpayConfigured: boolean;
  juspayConfigured: boolean;
  nodeEnv: string;
  recentErrors: Array<{
    id: string;
    severity?: string;
    source: string;
    message: string;
    createdAt?: string;
  }>;
};

export default function SystemPage() {
  const q = useAdminQuery<SystemResponse>("/api/admin/system", undefined, {
    refetchInterval: 60_000,
  });
  const data = q.data;

  return (
    <CardContent className="px-3 lg:px-6 pb-6 space-y-6">
      {q.error ? (
        <p className="text-sm text-red-700">{(q.error as Error).message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link to="/system/errors">Error logs</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/system/audit">Audit logs</Link>
        </Button>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-stone-600">Loading system status…</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminStatusCard
              title="Database (PostgreSQL)"
              ok={data.postgresConfigured && data.postgresOk}
              detail={
                data.postgresConfigured
                  ? data.postgresOk
                    ? `Latency ${data.postgresLatencyMs ?? "—"} ms`
                    : "Connection failed"
                  : "DATABASE_URL not set"
              }
            />
            <AdminStatusCard
              title="API"
              ok
              detail={`Node ${data.nodeEnv}`}
            />
            <AdminStatusCard
              title="Stripe"
              ok={data.stripeConfigured}
              detail={
                data.webhookConfigured
                  ? "Secret + webhook configured"
                  : data.stripeConfigured
                    ? "Secret configured (no webhook secret)"
                    : "STRIPE_SECRET_KEY not set"
              }
            />
            <AdminStatusCard
              title="Razorpay"
              ok={data.razorpayConfigured}
              detail={
                data.razorpayConfigured
                  ? "Key ID + secret configured"
                  : "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set"
              }
            />
            <AdminStatusCard
              title="Email (Resend)"
              ok={data.resendConfigured}
              detail={
                data.resendConfigured
                  ? "API key + from address configured"
                  : "RESEND_API_KEY or RESEND_FROM_EMAIL missing"
              }
            />
            <AdminStatusCard
              title="Media storage"
              ok={data.postgresOk}
              detail="Blob or Cloudinary — test uploads on Media page"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-stone-800 mb-3">
              Recent errors
            </h2>
            {data.recentErrors.length === 0 ? (
              <p className="text-sm text-stone-600">No recent errors.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentErrors.slice(0, 10).map((err) => (
                  <li
                    key={err.id}
                    className="rounded-lg border border-stone-200 p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {err.severity ? (
                        <Badge variant="secondary">{err.severity}</Badge>
                      ) : null}
                      <span className="text-stone-500">{err.source}</span>
                    </div>
                    <p className="text-stone-800">{err.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </CardContent>
  );
}
