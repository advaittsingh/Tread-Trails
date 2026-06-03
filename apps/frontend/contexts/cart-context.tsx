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

import type { Product } from "@/data/types";
import { resolveVariants, unitPriceForVariant } from "@/lib/pricing";

export type CartLine = {
  lineId: string;
  productSlug: string;
  variantId: string;
  variantLabel: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number | null;
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (input: {
    product: Product;
    variantId?: string;
    quantity?: number;
  }) => void;
  setQty: (lineId: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  subtotal: number;
  totalQuantity: number;
  hasPoaLines: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tread-trails-cart-v1";

function makeLineId(slug: string, variantId: string) {
  return `${slug}__${variantId}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback(
    (input: { product: Product; variantId?: string; quantity?: number }) => {
      const { product } = input;
      const qty = input.quantity ?? 1;
      const variants = resolveVariants(product);
      const v =
        variants.find((x) => x.id === input.variantId) ?? variants[0];
      const id = makeLineId(product.slug, v.id);
      const unitPrice = unitPriceForVariant(product, v.id);

      setLines((prev) => {
        const existing = prev.find((l) => l.lineId === id);
        if (existing) {
          return prev.map((l) =>
            l.lineId === id ? { ...l, quantity: l.quantity + qty } : l
          );
        }
        return [
          ...prev,
          {
            lineId: id,
            productSlug: product.slug,
            variantId: v.id,
            variantLabel: v.label,
            name: product.name,
            image: product.images[0] ?? "",
            quantity: qty,
            unitPrice,
          },
        ];
      });
    },
    []
  );

  const setQty = useCallback((lineId: string, qty: number) => {
    if (qty < 1) {
      setLines((prev) => prev.filter((l) => l.lineId !== lineId));
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
    );
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { subtotal, totalQuantity, hasPoaLines } = useMemo(() => {
    let sub = 0;
    let tq = 0;
    let poa = false;
    for (const l of lines) {
      tq += l.quantity;
      if (l.unitPrice == null) poa = true;
      else sub += l.unitPrice * l.quantity;
    }
    return { subtotal: sub, totalQuantity: tq, hasPoaLines: poa };
  }, [lines]);

  const value = useMemo(
    (): CartContextValue => ({
      lines,
      addItem,
      setQty,
      removeLine,
      clear,
      subtotal,
      totalQuantity,
      hasPoaLines,
    }),
    [lines, addItem, setQty, removeLine, clear, subtotal, totalQuantity, hasPoaLines]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
