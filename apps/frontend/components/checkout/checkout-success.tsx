"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { formatInr } from "@/lib/format";
import { useCart } from "@/contexts/cart-context";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const gateway = searchParams.get("gateway");
  const orderId = searchParams.get("order_id");
  const { clear } = useCart();

  const [status, setStatus] = useState<"loading" | "ok" | "error" | "pending">(
    "loading"
  );
  const [detail, setDetail] = useState<string | null>(null);

  const runJuspaySync = useCallback(async () => {
    if (!orderId) return null;
    const res = await fetch("/api/orders/juspay/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    return (await res.json()) as {
      paid?: boolean;
      juspayStatus?: string;
      error?: string;
      order?: { total: number; customerEmail: string; status: string };
    };
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;

    async function stripeFlow() {
      if (!sessionId) return;
      try {
        const res = await fetch(
          `/api/orders/verify?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = (await res.json()) as {
          error?: string;
          order?: { total: number; status: string; customerEmail: string };
          stripePaymentStatus?: string;
        };
        if (!res.ok || cancelled) {
          if (!cancelled) {
            setStatus("error");
            setDetail(data.error ?? "Could not verify payment.");
          }
          return;
        }
        if (cancelled) return;
        clear();
        setDetail(
          data.order
            ? `Paid ${formatInr(data.order.total)} — confirmation sent to ${data.order.customerEmail}.`
            : null
        );
        setStatus("ok");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setDetail("Verification failed.");
        }
      }
    }

    async function razorpayFlow() {
      if (!orderId) return;
      try {
        const res = await fetch(
          `/api/orders/receipt?order_id=${encodeURIComponent(orderId)}`
        );
        const data = (await res.json()) as {
          error?: string;
          order?: { total: number; customerEmail: string };
        };
        if (!res.ok || cancelled) {
          if (!cancelled) {
            setStatus("error");
            setDetail(data.error ?? "Could not load receipt.");
          }
          return;
        }
        clear();
        setDetail(
          data.order
            ? `Paid ${formatInr(data.order.total)} — confirmation sent to ${data.order.customerEmail}.`
            : null
        );
        setStatus("ok");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setDetail("Receipt lookup failed.");
        }
      }
    }

    async function juspayFlow() {
      if (!orderId) return;
      try {
        const sync = await runJuspaySync();
        if (cancelled || !sync) return;

        if (cancelled) return;

        if (sync.error) {
          setStatus("error");
          setDetail(sync.error);
          return;
        }

        if (sync.paid && sync.order) {
          clear();
          setDetail(
            `Paid ${formatInr(sync.order.total)} — confirmation sent to ${sync.order.customerEmail}.`
          );
          setStatus("ok");
          return;
        }

        setStatus("pending");
        setDetail(
          `Juspay status: ${sync.juspayStatus ?? "pending"}. If you completed payment, tap Refresh — settlement can take a moment.`
        );
      } catch {
        if (!cancelled) {
          setStatus("error");
          setDetail("Could not sync Juspay order.");
        }
      }
    }

    if (sessionId) {
      stripeFlow();
      return () => {
        cancelled = true;
      };
    }

    if (gateway === "razorpay" && orderId) {
      razorpayFlow();
      return () => {
        cancelled = true;
      };
    }

    if (gateway === "juspay" && orderId) {
      juspayFlow();
      return () => {
        cancelled = true;
      };
    }

    setStatus("error");
    setDetail("Missing checkout reference — open this page from your payment confirmation.");
    return () => {
      cancelled = true;
    };
  }, [sessionId, gateway, orderId, clear, runJuspaySync]);

  async function refreshJuspay() {
    setStatus("loading");
    setDetail(null);
    try {
      const sync = await runJuspaySync();
      if (!sync) return;
      if (sync.error) {
        setStatus("error");
        setDetail(sync.error);
        return;
      }
      if (sync.paid && sync.order) {
        clear();
        setDetail(
          `Paid ${formatInr(sync.order.total)} — confirmation sent to ${sync.order.customerEmail}.`
        );
        setStatus("ok");
        return;
      }
      setStatus("pending");
      setDetail(
        `Still pending (${sync.juspayStatus ?? "unknown"}). Try Refresh again shortly.`
      );
    } catch {
      setStatus("error");
      setDetail("Refresh failed.");
    }
  }

  if (status === "loading") {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle as="h1" className="font-heading text-2xl tracking-tight">
            Confirming payment…
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {sessionId
            ? "Syncing Stripe session with your order."
            : gateway === "juspay"
              ? "Checking Juspay order status."
              : "Loading receipt."}
        </CardContent>
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle as="h1" className="font-heading text-2xl tracking-tight">
            Payment pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{detail}</p>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
            onClick={() => refreshJuspay()}
          >
            Refresh status
          </button>
        </CardContent>
        <CardFooter>
          <Link href="/account" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}>
            Account
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle as="h1" className="font-heading text-2xl tracking-tight">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
        <CardFooter>
          <Link href="/account" className={cn(buttonVariants(), "w-full justify-center")}>
            Account
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg border-border/70 shadow-card">
      <CardHeader>
        <CardTitle as="h1" className="font-heading text-2xl tracking-tight">
          Payment received
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Thank you — your expedition stack is now locked for fulfilment.</p>
        {detail ? <p>{detail}</p> : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/account"
          className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
        >
          View orders
        </Link>
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
        >
          Keep browsing
        </Link>
      </CardFooter>
    </Card>
  );
}
