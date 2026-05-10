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

import { cars } from "@/data/cars";
import { useAuth } from "@/contexts/auth-context";
import { isKnownVehicleCatalogSlug } from "@/lib/vehicle-catalog-slugs";

type SelectedVehicleContextValue = {
  /** Stored chassis slug, or null if cleared / never set */
  slug: string | null;
  vehicleName: string | null;
  /** False until localStorage has been read (avoid SSR mismatch). */
  hydrated: boolean;
  setSelectedSlug: (slug: string | null) => void;
  clearSelectedVehicle: () => void;
};

const SelectedVehicleContext =
  createContext<SelectedVehicleContextValue | null>(null);

const STORAGE_KEY = "tread-trails-selected-vehicle-v1";

export function SelectedVehicleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, refresh } = useAuth();
  const [slug, setSlugState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { slug?: string };
        const s = parsed?.slug;
        if (typeof s === "string" && isKnownVehicleCatalogSlug(s)) setSlugState(s);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (slug && isKnownVehicleCatalogSlug(slug)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ slug }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [slug, hydrated]);

  /** Account preference overrides device when signed in */
  useEffect(() => {
    if (!hydrated || authLoading || !user) return;
    const P = user.preferredVehicleSlug;
    if (typeof P === "string" && isKnownVehicleCatalogSlug(P)) {
      setSlugState(P);
    }
  }, [hydrated, authLoading, user?.id, user?.preferredVehicleSlug]);

  const persistPreferred = useCallback(
    async (next: string | null) => {
      if (!user) return;
      try {
        await fetch("/api/user/preferences", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredVehicleSlug: next }),
        });
        await refresh();
      } catch {
        /* ignore */
      }
    },
    [user, refresh]
  );

  const setSelectedSlug = useCallback(
    (next: string | null) => {
      if (next !== null && next !== "" && !isKnownVehicleCatalogSlug(next)) return;
      const normalized = next === "" ? null : next;
      setSlugState(normalized);
      if (user && !authLoading) {
        void persistPreferred(normalized);
      }
    },
    [user, authLoading, persistPreferred]
  );

  const clearSelectedVehicle = useCallback(() => {
    setSlugState(null);
    if (user && !authLoading) {
      void persistPreferred(null);
    }
  }, [user, authLoading, persistPreferred]);

  const vehicleName = useMemo(() => {
    if (!slug) return null;
    return cars.find((c) => c.slug === slug)?.name ?? null;
  }, [slug]);

  const value = useMemo(
    () => ({
      slug,
      vehicleName,
      hydrated,
      setSelectedSlug,
      clearSelectedVehicle,
    }),
    [slug, vehicleName, hydrated, setSelectedSlug, clearSelectedVehicle]
  );

  return (
    <SelectedVehicleContext.Provider value={value}>
      {children}
    </SelectedVehicleContext.Provider>
  );
}

export function useSelectedVehicle() {
  const ctx = useContext(SelectedVehicleContext);
  if (!ctx) {
    throw new Error(
      "useSelectedVehicle must be used within SelectedVehicleProvider"
    );
  }
  return ctx;
}
