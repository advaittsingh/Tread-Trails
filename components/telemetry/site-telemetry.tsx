"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { PRESENCE_HEARTBEAT_MS } from "@/lib/presence/constants";

function ensureSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("tt_sess");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("tt_sess", id);
  }
  return id;
}

function sendPing(sessionId: string, path: string, useBeacon = false): void {
  if (!sessionId || path.startsWith("/admin")) return;
  const body = JSON.stringify({ sessionId, path });

  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/track/ping", blob);
    return;
  }

  void fetch("/api/track/ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function sendPageHit(sessionId: string, path: string): void {
  if (!sessionId || path.startsWith("/admin")) return;
  void fetch("/api/track/page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, path }),
    keepalive: true,
  }).catch(() => {});
}

export function SiteTelemetry() {
  const pathname = usePathname();
  const sessionRef = useRef("");
  const lastPathRef = useRef("");

  useEffect(() => {
    sessionRef.current = ensureSessionId();
  }, []);

  useEffect(() => {
    const sessionId = sessionRef.current;
    if (!sessionId || !pathname || pathname.startsWith("/admin")) return;

    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      sendPageHit(sessionId, pathname);
      sendPing(sessionId, pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const sessionId = sessionRef.current;
    if (!sessionId) return;

    const heartbeat = () => {
      const path = window.location.pathname;
      if (path.startsWith("/admin")) return;
      sendPing(sessionId, path);
    };

    const intervalId = window.setInterval(heartbeat, PRESENCE_HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        heartbeat();
      }
    };

    const onPageHide = () => {
      const path = window.location.pathname;
      sendPing(sessionId, path, true);
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
