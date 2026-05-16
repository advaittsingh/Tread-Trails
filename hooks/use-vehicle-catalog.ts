"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Car } from "@/data/types";
import { cars as staticCars } from "@/data/cars";

let globalSlugs: Set<string> | null = null;

/** Client-side slug validation (DB catalog when loaded, else static). */
export function isKnownVehicleCatalogSlug(slug: string): boolean {
  if (globalSlugs) return globalSlugs.has(slug);
  return staticCars.some((c) => c.slug === slug);
}

export function useVehicleCatalog() {
  const [vehicles, setVehicles] = useState<Car[]>(staticCars);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vehicles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load vehicles");
      const list = (data.vehicles ?? []) as Car[];
      if (list.length > 0) {
        setVehicles(list);
        globalSlugs = new Set(list.map((v) => v.slug));
      } else {
        setVehicles(staticCars);
        globalSlugs = new Set(staticCars.map((c) => c.slug));
      }
    } catch (e) {
      setVehicles(staticCars);
      globalSlugs = new Set(staticCars.map((c) => c.slug));
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const slugs = useMemo(() => new Set(vehicles.map((v) => v.slug)), [vehicles]);

  return { vehicles, loading, error, slugs, reload };
}
