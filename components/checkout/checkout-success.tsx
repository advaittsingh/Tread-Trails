"use client";

import { useEffect, useState } from "react";
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
  const { clear } = useCart();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setDetail("Missing payment session.");
      return;
    }

    let cancelled = false;
    (async () => {
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
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, clear]);

  if (status === "loading") {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-2xl tracking-tight">
            Confirming payment…
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Syncing Stripe session with your garage order.
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-2xl tracking-tight">
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
        <CardTitle className="font-heading text-2xl tracking-tight">
          Payment received
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Thank you — your expedition stack is now locked for fulfilment.</p>
        {detail ? <p>{detail}</p> : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Link href="/account" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}>
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
