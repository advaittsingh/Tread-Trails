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

export const MAX_COMPARE = 4;

type CompareContextValue = {
  slugs: string[];
  hydrated: boolean;
  count: number;
  isFull: boolean;
  has: (slug: string) => boolean;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "tread-trails-compare-v1";

function normalizeSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const next = raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return Array.from(new Set(next)).slice(0, MAX_COMPARE);
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        setSlugs(normalizeSlugs(parsed));
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

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const remove = useCallback((slug: string) => {
    setSlugs((prev) => prev.filter((x) => x !== slug));
  }, []);

  const toggle = useCallback((slug: string) => {
    const s = slug.trim();
    if (!s) return;
    setSlugs((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, s];
    });
  }, []);

  const clear = useCallback(() => setSlugs([]), []);

  const value = useMemo<CompareContextValue>(
    () => ({
      slugs,
      hydrated,
      count: slugs.length,
      isFull: slugs.length >= MAX_COMPARE,
      has,
      remove,
      toggle,
      clear,
    }),
    [slugs, hydrated, has, remove, toggle, clear]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
