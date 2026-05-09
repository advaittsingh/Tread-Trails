"use client";

import { useCallback, useEffect, useState } from "react";

import { PresenceMap } from "@/components/admin/presence-map";
import type { PresenceMarker } from "@/components/admin/presence-map-inner";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPresencePanel() {
  const [sessions, setSessions] = useState<PresenceMarker[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/presence", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSessions(data.sessions as PresenceMarker[]);
      setCount(data.count as number);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          Live presence
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Polling every 15s · TTL sessions expire ~3 minutes after the last heartbeat from /api/track/ping.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 lg:col-span-1">
          <p className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">
            Active signals
          </p>
          <p className="mt-4 font-heading text-4xl tracking-tight text-white tabular-nums">
            {loading ? "—" : count}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Includes shoppers with telemetry enabled (non-/admin paths).
          </p>
        </div>
        <div className="lg:col-span-2">
          {loading ? (
            <Skeleton className="h-[340px] w-full rounded-2xl bg-zinc-900" />
          ) : (
            <PresenceMap sessions={sessions} />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Geo</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {!loading &&
                sessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      {s.sessionId.slice(0, 14)}…
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{s.path}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {s.lastSeenAt
                        ? new Date(s.lastSeenAt).toLocaleTimeString()
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
