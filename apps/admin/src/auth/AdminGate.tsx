import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { apiFetchJson, ensureCsrfToken } from "@/api/client";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "ok" } | { status: "unauthorized" }
  >({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await apiFetchJson<{ user?: { role?: string } }>("/api/auth/me");
        const ok = me.user?.role === "admin";
        if (ok) await ensureCsrfToken();
        if (mounted) setState(ok ? { status: "ok" } : { status: "unauthorized" });
      } catch {
        if (mounted) setState({ status: "unauthorized" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.status === "loading") return null;
  if (state.status === "unauthorized") {
    return <Navigate to="/auth/sign-in" replace />;
  }
  return <>{children}</>;
}

