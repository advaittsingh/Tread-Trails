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

  const toggle = useCallback((vehicleSlug: string) => {
    setSlugs((prev) =>
      prev.includes(vehicleSlug)
        ? prev.filter((s) => s !== vehicleSlug)
        : [...prev, vehicleSlug]
    );
  }, []);

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
