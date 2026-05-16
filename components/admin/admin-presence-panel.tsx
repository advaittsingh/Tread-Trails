"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  PRESENCE_ADMIN_POLL_HIDDEN_MS,
  PRESENCE_ADMIN_POLL_VISIBLE_MS,
  PRESENCE_TTL_MS,
} from "@/lib/presence/constants";

import { PresenceMap } from "@/components/admin/presence-map";
import type { PresenceMarker } from "@/components/admin/presence-map-inner";
import { Skeleton } from "@/components/ui/skeleton";

type PresencePayload = {
  count: number;
  sessions: PresenceMarker[];
  ttlMs: number;
  serverTime: string;
  fingerprint?: string;
};

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export function AdminPresencePanel() {
  const [sessions, setSessions] = useState<PresenceMarker[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const etagRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const headers: HeadersInit = {};
      if (etagRef.current) {
        headers["If-None-Match"] = etagRef.current;
      }

      const res = await fetch("/api/admin/presence", {
        credentials: "include",
        headers,
      });

      if (res.status === 304) {
        setError(null);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      const payload = data as PresencePayload;
      const fp =
        payload.fingerprint ?? res.headers.get("etag") ?? null;
      if (fp) etagRef.current = fp;

      setSessions(payload.sessions);
      setCount(payload.count);
      setServerTime(payload.serverTime);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    let intervalId = 0;

    const schedule = () => {
      window.clearInterval(intervalId);
      const ms =
        document.visibilityState === "visible"
          ? PRESENCE_ADMIN_POLL_VISIBLE_MS
          : PRESENCE_ADMIN_POLL_HIDDEN_MS;
      intervalId = window.setInterval(() => void load(), ms);
    };

    schedule();
    document.addEventListener("visibilitychange", schedule);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [load]);

  const ttlMin = Math.round(PRESENCE_TTL_MS / 60_000);

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          Live presence
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Heartbeat every 60s · TTL {ttlMin} minutes · stale rows purged on poll
          and every 2 min via cron. Count reflects only sessions seen within the
          TTL window.
        </p>
        {serverTime ? (
          <p className="mt-1 text-[11px] text-zinc-600">
            Server clock {new Date(serverTime).toLocaleTimeString()}
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 lg:col-span-1">
          <p className="text-[11px] tracking-[0.25em] text-zinc-500 uppercase">
            Live visitors
          </p>
          <p className="mt-4 font-heading text-4xl tracking-tight text-white tabular-nums">
            {loading ? "—" : count}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Accurate active count (not historical sessions). Excludes /admin
            paths.
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
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] tracking-wide text-zinc-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Session</th>
                <th className="px-4 py-3 font-medium">Current page</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Geo</th>
                <th className="px-4 py-3 font-medium">Duration</th>
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
                    <td className="max-w-[200px] truncate px-4 py-3 text-zinc-200">
                      {s.path}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      <span className="capitalize text-zinc-500">
                        {s.deviceType ?? "—"}
                      </span>
                      {s.deviceLabel ? (
                        <span className="mt-0.5 block text-zinc-300">
                          {s.deviceLabel}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-zinc-300">
                      {formatDuration(s.sessionDurationSec ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {s.idleSec === 0
                        ? "now"
                        : `${s.idleSec ?? "—"}s ago`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && sessions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No live visitors in the last {ttlMin} minutes.
          </p>
        ) : null}
      </div>
    </div>
  );
}
