import { useEffect, useState } from "react";
import { apiFetchJson } from "@/api/client";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/api/client";

const WARN_THRESHOLD_SEC = 15 * 60;

export function SessionExpiryBanner() {
  const [expiresInSec, setExpiresInSec] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const data = await apiFetchJson<{
          session?: { expiresInSec?: number | null };
        }>("/api/auth/session");
        if (mounted) {
          setExpiresInSec(data.session?.expiresInSec ?? null);
        }
      } catch {
        if (mounted) setExpiresInSec(null);
      }
    };

    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  if (expiresInSec == null || expiresInSec > WARN_THRESHOLD_SEC) {
    return null;
  }

  const mins = Math.max(1, Math.ceil(expiresInSec / 60));

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-3">
      <span>
        Your admin session expires in about {mins} minute{mins === 1 ? "" : "s"}.
        Save work and sign in again to continue.
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void apiFetch("/api/auth/logout", { method: "POST" }).then(() => {
          window.location.hash = "#/auth/sign-in";
        })}
      >
        Sign out
      </Button>
    </div>
  );
}
