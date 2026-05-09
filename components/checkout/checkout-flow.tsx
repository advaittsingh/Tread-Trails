"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { formatInr } from "@/lib/format";
import { useCart } from "@/contexts/cart-context";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Payment = "upi" | "card" | "cod";

export function CheckoutFlow() {
  const { lines, subtotal, hasPoaLines, clear } = useCart();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [payment, setPayment] = useState<Payment>("upi");
  const [done, setDone] = useState(false);
  const [doneDetail, setDoneDetail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

  function next() {
    setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError(null);
    if (hasPoaLines || lines.some((l) => l.unitPrice == null)) {
      setError(
        "Your cart includes price-on-application items. Remove them or reach out on WhatsApp before paying online."
      );
      return;
    }

    const paymentChannel = payment === "cod" ? "cod" : "stripe";

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          shippingAddress: {
            line1,
            line2: line2 || undefined,
            city,
            region,
            postal,
          },
          paymentChannel,
          items: lines.map((l) => ({
            productSlug: l.productSlug,
            variantId: l.variantId,
            variantLabel: l.variantLabel,
            name: l.name,
            image: l.image,
            quantity: l.quantity,
          })),
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        checkoutUrl?: string;
        mode?: string;
        message?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }

      if (data.mode === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.mode === "cod") {
        clear();
        setDoneDetail(data.message ?? null);
        setDone(true);
        return;
      }

      setError("Unexpected response from checkout service.");
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0 && !done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border/80 bg-card px-8 py-14 text-center shadow-card">
        <p className="font-heading text-xl tracking-tight">Your cart is empty</p>
        <Link href="/products" className={cn(buttonVariants(), "mt-6 inline-flex")}>
          Browse catalog
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-2xl tracking-tight">
            Order recorded
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Thanks, {name}. {doneDetail ?? "Our fulfilment desk will confirm dispatch windows shortly."}</p>
          <p>
            Confirmation correspondence goes to{" "}
            <span className="text-foreground">{email}</span>.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/account" className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}>
            View account
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl border-border/70 shadow-card">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="font-heading text-2xl tracking-tight">
            Checkout
          </CardTitle>
          <span className="text-xs tracking-widest text-muted-foreground uppercase">
            Step {step + 1} / 4
          </span>
        </div>
        <Progress value={progress} />
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="co-name">Full name</Label>
              <Input
                id="co-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-phone">Phone</Label>
              <Input
                id="co-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-email">Email</Label>
              <Input
                id="co-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="co-line1">Address line 1</Label>
              <Input
                id="co-line1"
                autoComplete="address-line1"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-line2">Address line 2 (optional)</Label>
              <Input
                id="co-line2"
                autoComplete="address-line2"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="co-city">City</Label>
                <Input
                  id="co-city"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-region">State / Region</Label>
                <Input
                  id="co-region"
                  autoComplete="address-level1"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-postal">Postal code</Label>
                <Input
                  id="co-postal"
                  autoComplete="postal-code"
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <fieldset className="space-y-3">
            <legend className="font-medium text-foreground">Payment method</legend>
            {(
              [
                ["upi", "UPI"],
                ["card", "Card"],
                ["cod", "Cash on delivery"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 shadow-card transition hover:border-primary/30 hover:shadow-card-hover has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="payment"
                  value={value}
                  checked={payment === value}
                  onChange={() => setPayment(value)}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              UPI and card settle through Stripe Checkout. COD stays pending until our team confirms manually.
            </p>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 text-sm">
            {hasPoaLines ? (
              <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-amber-950 dark:text-amber-100">
                Price-on-application SKUs cannot proceed online — switch those lines out or message us on WhatsApp.
              </p>
            ) : null}
            <div className="rounded-xl border border-border/70 bg-muted/25 p-4 shadow-inner">
              <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                Customer
              </p>
              <p className="mt-1 font-medium text-foreground">{name}</p>
              <p className="text-muted-foreground">{phone}</p>
              <p className="text-muted-foreground">{email}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/25 p-4 shadow-inner">
              <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                Ship to
              </p>
              <p className="mt-1 text-foreground">
                {line1}
                {line2 ? `, ${line2}` : ""}
              </p>
              <p className="text-muted-foreground">
                {city}, {region} {postal}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/25 p-4 shadow-inner">
              <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                Payment
              </p>
              <p className="mt-1 capitalize text-foreground">{payment}</p>
            </div>
            <Separator />
            <div className="flex justify-between font-heading text-lg">
              <span>Estimated total</span>
              <span className="tabular-nums">
                {hasPoaLines && subtotal === 0 ? "Quote" : formatInr(subtotal) ?? "—"}
              </span>
            </div>
            <ul className="max-h-48 space-y-2 overflow-auto text-muted-foreground">
              {lines.map((l) => (
                <li key={l.lineId} className="flex justify-between gap-2">
                  <span className="truncate">
                    {l.name} × {l.quantity}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {l.unitPrice != null ? formatInr(l.unitPrice * l.quantity) : "POA"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between gap-3 border-t border-border/60 bg-muted/20">
        <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || submitting}>
          Back
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            onClick={next}
            disabled={
              (step === 0 && (!name || !phone || !email)) ||
              (step === 1 && (!line1 || !city || !region || !postal))
            }
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submit}
            disabled={
              submitting ||
              hasPoaLines ||
              lines.some((l) => l.unitPrice == null)
            }
          >
            {submitting ? "Processing…" : payment === "cod" ? "Place COD order" : "Pay securely"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
