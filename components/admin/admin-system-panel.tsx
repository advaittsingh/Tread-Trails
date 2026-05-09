"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type Payload = {
  mongoOk: boolean;
  mongoLatencyMs: number | null;
  stripeConfigured: boolean;
  webhookConfigured: boolean;
  resendConfigured: boolean;
  nodeEnv: string;
  recentErrors: { id: string; source: string; message: string; createdAt?: string }[];
};

export function AdminSystemPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/system", { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        if (!cancelled) setData(json as Payload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          System health
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Operational probes — extend with central logging when you wire Datadog / Sentry.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {!data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl bg-zinc-900" />
          <Skeleton className="h-32 rounded-2xl bg-zinc-900" />
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FlagCard
            title="MongoDB"
            ok={data.mongoOk}
            detail={`Probe latency ${data.mongoLatencyMs ?? "—"} ms`}
          />
          <FlagCard
            title="Stripe secret"
            ok={data.stripeConfigured}
            detail="Checkout sessions"
          />
          <FlagCard
            title="Stripe webhook"
            ok={data.webhookConfigured}
            detail="Signature verification"
          />
          <FlagCard
            title="Resend CRM"
            ok={data.resendConfigured}
            detail="Transactional mail"
          />
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase">
              Runtime
            </p>
            <p className="mt-3 font-mono text-lg text-zinc-100">{data.nodeEnv}</p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="border-b border-zinc-800 px-5 py-4">
          <p className="text-sm font-medium text-zinc-200">Recent captured errors</p>
          <p className="text-xs text-zinc-500">
            Populate via <code className="text-emerald-300">AppErrorLog</code> inserts from workers/webhooks.
          </p>
        </div>
        <div className="divide-y divide-zinc-800/80">
          {!data ? (
            <Skeleton className="m-5 h-16 rounded-lg bg-zinc-800" />
          ) : data.recentErrors.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">
              No errors logged yet.
            </p>
          ) : (
            data.recentErrors.map((l) => (
              <div key={l.id} className="px-5 py-4">
                <p className="text-xs font-medium tracking-wide text-rose-300 uppercase">
                  {l.source}
                </p>
                <p className="mt-1 text-sm text-zinc-200">{l.message}</p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  {l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function FlagCard({
  title,
  ok,
  detail,
}: {
  title: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase">{title}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            ok ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
          }`}
        >
          {ok ? "Healthy" : "Missing"}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-300">{detail}</p>
    </div>
  );
}
