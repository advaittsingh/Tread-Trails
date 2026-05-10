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
import { toastError } from "@/lib/toast";

type WishlistContextValue = {
  slugs: string[];
  toggle: (productSlug: string) => void;
  has: (productSlug: string) => boolean;
  /** Signed-in: merging guest localStorage list with Postgres after login */
  isRemoteHydrating: boolean;
  /** Signed-in toggle POST in flight */
  isMutationPending: boolean;
  /** Merge or mutation failure */
  remoteError: string | null;
  clearRemoteError: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "tread-trails-wishlist-v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [mergeDone, setMergeDone] = useState(() => false);
  const [mutationPending, setMutationPending] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setSlugs(parsed.filter((x): x is string => typeof x === "string"));
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

  useEffect(() => {
    if (!user) {
      setMergeDone(true);
      setRemoteError(null);
      return;
    }

    if (!hydrated || authLoading) return;

    let cancelled = false;
    setMergeDone(false);
    setRemoteError(null);

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

        const res = await fetch("/api/user/wishlist", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) {
            setRemoteError(
              res.status === 401
                ? "Sign in again to sync your wishlist."
                : "Could not load wishlist from account."
            );
          }
          return;
        }

        const data = (await res.json()) as { slugs?: string[] };
        const server = Array.isArray(data.slugs) ? data.slugs : [];
        const merged = Array.from(new Set([...local, ...server]));
        const serverSet = new Set(server);
        const needsPut =
          merged.length !== server.length || merged.some((s) => !serverSet.has(s));

        if (needsPut && !cancelled) {
          const putRes = await fetch("/api/user/wishlist", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: merged }),
          });
          if (!putRes.ok) {
            const errJson = (await putRes.json()) as { error?: string };
            if (!cancelled) {
              const msg = errJson.error ?? "Could not merge guest wishlist.";
              setRemoteError(msg);
              toastError("Wishlist merge", msg);
              setSlugs(merged);
            }
            return;
          }
          const putJson = (await putRes.json()) as { slugs?: string[] };
          if (Array.isArray(putJson.slugs) && !cancelled) {
            setSlugs(putJson.slugs);
            return;
          }
        }

        if (!cancelled) setSlugs(merged);
      } catch {
        if (!cancelled) {
          setRemoteError("Network error syncing wishlist.");
        }
      } finally {
        if (!cancelled) setMergeDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, authLoading, user?.id]);

  const clearRemoteError = useCallback(() => setRemoteError(null), []);

  const toggle = useCallback(
    (productSlug: string) => {
      if (!productSlug.trim()) return;

      setSlugs((prev) => {
        const optimistic = prev.includes(productSlug)
          ? prev.filter((s) => s !== productSlug)
          : [...prev, productSlug];

        if (user && !authLoading && mergeDone) {
          setMutationPending(true);
          void (async () => {
            try {
              const res = await fetch("/api/user/wishlist", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productSlug }),
              });
              const data = (await res.json()) as {
                slugs?: string[];
                error?: string;
              };
              if (res.ok && Array.isArray(data.slugs)) {
                setSlugs(data.slugs);
                setRemoteError(null);
              } else {
                setSlugs(prev);
                const msg = data.error ?? "Could not update wishlist.";
                setRemoteError(msg);
                toastError("Wishlist", msg);
              }
            } catch {
              setSlugs(prev);
              const msg = "Network error updating wishlist.";
              setRemoteError(msg);
              toastError("Wishlist", msg);
            } finally {
              setMutationPending(false);
            }
          })();
        }

        return optimistic;
      });
    },
    [user, authLoading, mergeDone]
  );

  const has = useCallback(
    (productSlug: string) => slugs.includes(productSlug),
    [slugs]
  );

  const isRemoteHydrating = Boolean(user && hydrated && !authLoading && !mergeDone);

  const value = useMemo(
    () => ({
      slugs,
      toggle,
      has,
      isRemoteHydrating,
      isMutationPending: mutationPending,
      remoteError,
      clearRemoteError,
    }),
    [
      slugs,
      toggle,
      has,
      isRemoteHydrating,
      mutationPending,
      remoteError,
      clearRemoteError,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
