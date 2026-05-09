"use client";

import dynamic from "next/dynamic";

import type { PresenceMarker } from "@/components/admin/presence-map-inner";

const Inner = dynamic(() => import("./presence-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/80" />
  ),
});

export function PresenceMap({ sessions }: { sessions: PresenceMarker[] }) {
  return <Inner sessions={sessions} />;
}
