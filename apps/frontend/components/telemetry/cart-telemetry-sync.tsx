"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";

function readSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("tt_sess");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("tt_sess", id);
  }
  return id;
}

export function CartTelemetrySync() {
  const { lines, subtotal } = useCart();
  const pathname = usePathname();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(readSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId || pathname?.startsWith("/admin")) return;

    const handle = window.setTimeout(() => {
      const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
      void fetch("/api/track/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          lines: lines.map((l) => ({
            productSlug: l.productSlug,
            quantity: l.quantity,
            name: l.name,
            variantId: l.variantId,
            unitPrice: l.unitPrice,
            image: l.image || undefined,
          })),
          itemCount,
          subtotalHint: subtotal,
          userEmail: user?.email,
          customerName: user?.name ?? undefined,
          lastPath: pathname ?? "/",
        }),
        keepalive: true,
      }).catch(() => {});
    }, 12_000);

    return () => window.clearTimeout(handle);
  }, [lines, subtotal, pathname, sessionId, user?.email]);

  return null;
}
