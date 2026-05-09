"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function ensureSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("tt_sess");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("tt_sess", id);
  }
  return id;
}

export function SiteTelemetry() {
  const pathname = usePathname();
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    setSessionId(ensureSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId || !pathname || pathname.startsWith("/admin")) return;

    const body = JSON.stringify({ sessionId, path: pathname });

    void fetch("/api/track/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});

    void fetch("/api/track/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const id = window.setInterval(() => {
      const path = window.location.pathname;
      if (path.startsWith("/admin")) return;
      const sid = window.localStorage.getItem("tt_sess");
      if (!sid) return;
      void fetch("/api/track/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, path }),
        keepalive: true,
      }).catch(() => {});
    }, 45_000);
    return () => window.clearInterval(id);
  }, [sessionId]);

  return null;
}
