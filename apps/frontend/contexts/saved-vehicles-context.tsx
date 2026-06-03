"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import { isKnownVehicleCatalogSlug } from "@/lib/vehicle-catalog-slugs";

type SavedVehiclesContextValue = {
  slugs: string[];
  toggle: (vehicleSlug: string) => void;
  has: (vehicleSlug: string) => boolean;
};

const SavedVehiclesContext = createContext<SavedVehiclesContextValue | null>(
  null
);

const STORAGE_KEY = "tread-trails-saved-vehicles-v1";

export function SavedVehiclesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setSlugs(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  }, [slugs, hydrated]);

  /** Signed-in: merge device list with Neon so dashboard follows the account */
  useEffect(() => {
    if (!hydrated || authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        let local: string[] = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const p = JSON.parse(raw) as unknown;
            if (Array.isArray(p)) {
              local = p.filter((x): x is string => typeof x === "string");
            }
          }
        } catch {
          /* ignore */
        }

        const res = await fetch("/api/user/saved-vehicles", {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { slugs?: string[] };
        const server = Array.isArray(data.slugs) ? data.slugs : [];
        const merged = Array.from(new Set([...local, ...server]));
        const serverSet = new Set(server);
        const needsPut =
          merged.length !== server.length || merged.some((s) => !serverSet.has(s));

        if (needsPut && !cancelled) {
          const putRes = await fetch("/api/user/saved-vehicles", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: merged }),
          });
          if (!putRes.ok || cancelled) return;
          const putJson = (await putRes.json()) as { slugs?: string[] };
          if (Array.isArray(putJson.slugs) && !cancelled) {
            setSlugs(putJson.slugs);
            return;
          }
        }

        if (!cancelled) setSlugs(merged);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, authLoading, user?.id]);

  const toggle = useCallback(
    (vehicleSlug: string) => {
      if (!isKnownVehicleCatalogSlug(vehicleSlug)) return;

      setSlugs((prev) => {
        const optimistic = prev.includes(vehicleSlug)
          ? prev.filter((s) => s !== vehicleSlug)
          : [...prev, vehicleSlug];

        if (user && !authLoading) {
          void (async () => {
            try {
              const res = await fetch("/api/user/saved-vehicles", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vehicleSlug }),
              });
              if (res.ok) {
                const data = (await res.json()) as { slugs?: string[] };
                if (Array.isArray(data.slugs)) setSlugs(data.slugs);
              } else {
                setSlugs(prev);
              }
            } catch {
              setSlugs(prev);
            }
          })();
        }

        return optimistic;
      });
    },
    [user, authLoading]
  );

  const has = useCallback(
    (vehicleSlug: string) => slugs.includes(vehicleSlug),
    [slugs]
  );

  const value = useMemo(
    () => ({
      slugs,
      toggle,
      has,
    }),
    [slugs, toggle, has]
  );

  return (
    <SavedVehiclesContext.Provider value={value}>
      {children}
    </SavedVehiclesContext.Provider>
  );
}

export function useSavedVehicles() {
  const ctx = useContext(SavedVehiclesContext);
  if (!ctx) {
    throw new Error(
      "useSavedVehicles must be used within SavedVehiclesProvider"
    );
  }
  return ctx;
}
