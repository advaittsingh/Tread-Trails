"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { formatInr } from "@/lib/format";
import { loadRazorpayCheckoutScript, type RazorpayWindow } from "@/lib/checkout/load-razorpay-script";
import { useCart } from "@/contexts/cart-context";

import {
  checkoutGatewayLabel,
  type CheckoutGateway,
  type GatewayAvailability,
  PaymentMethodSelector,
} from "@/components/checkout/payment-method-selector";
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
import { validatePhone } from "@/lib/validations/phone";
import { cn } from "@/lib/utils";

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
  const [gateway, setGateway] = useState<CheckoutGateway>("stripe");
  const [avail, setAvail] = useState<GatewayAvailability>({
    stripe: false,
    razorpay: false,
    juspay: false,
    cod: true,
  });
  const [done, setDone] = useState(false);
  const [doneDetail, setDoneDetail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLock = useRef(false);

  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

  useEffect(() => {
    fetch("/api/payments/availability")
      .then((r) => r.json())
      .then((data: Partial<GatewayAvailability>) => {
        setAvail({
          stripe: Boolean(data.stripe),
          razorpay: Boolean(data.razorpay),
          juspay: Boolean(data.juspay),
          cod: data.cod !== false,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setGateway((current) => {
      if (avail[current]) return current;
      const order: CheckoutGateway[] = ["stripe", "razorpay", "juspay", "cod"];
      const next = order.find((x) => avail[x]);
      return next ?? "cod";
    });
  }, [avail]);

  function next() {
    setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (submitLock.current || submitting) return;
    setError(null);
    if (hasPoaLines || lines.some((l) => l.unitPrice == null)) {
      setError(
        "Your cart includes price-on-application items. Remove them or reach out on WhatsApp before paying online."
      );
      return;
    }

    if (!avail[gateway]) {
      setError("Selected payment method is not available right now.");
      return;
    }

    const phoneResult = validatePhone(phone);
    if (!phoneResult.ok) {
      setError(phoneResult.message);
      return;
    }

    const paymentChannel = gateway;

    let deferCheckoutIdleReset = false;
    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phoneResult.normalized,
          customerEmail: email.trim(),
          shippingAddress: {
            line1: line1.trim(),
            line2: line2.trim() || undefined,
            city: city.trim(),
            region: region.trim(),
            postal: postal.trim(),
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
        orderId?: string;
        razorpayOrderId?: string;
        amountPaise?: number;
        currency?: string;
        keyId?: string;
        prefillEmail?: string;
        prefillContact?: string;
        paymentLink?: string;
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

      if (data.mode === "juspay" && data.paymentLink && data.orderId) {
        window.location.href = data.paymentLink;
        return;
      }

      if (
        data.mode === "razorpay" &&
        data.orderId &&
        data.razorpayOrderId &&
        data.keyId &&
        data.amountPaise != null
      ) {
        await loadRazorpayCheckoutScript();
        const RZP = (window as unknown as RazorpayWindow).Razorpay;
        if (!RZP) {
          setError("Could not initialize Razorpay.");
          return;
        }

        const orderId = data.orderId;
        const options: Record<string, unknown> = {
          key: data.keyId,
          amount: data.amountPaise,
          currency: data.currency ?? "INR",
          order_id: data.razorpayOrderId,
          name: "Tread Trails",
          description: `Order ${orderId.slice(-8).toUpperCase()}`,
          prefill: {
            email: data.prefillEmail ?? email,
            contact: data.prefillContact ?? phoneResult.normalized.slice(-15),
          },
          theme: { color: "#1a5f4a" },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verify = await fetch("/api/orders/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  treadTrailsOrderId: orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const vJson = (await verify.json()) as { error?: string };
              if (!verify.ok) {
                setError(vJson.error ?? "Payment verification failed.");
                submitLock.current = false;
                setSubmitting(false);
                return;
              }
              clear();
              window.location.href = `/checkout/success?gateway=razorpay&order_id=${encodeURIComponent(orderId)}`;
            } catch {
              setError("Verification request failed.");
              submitLock.current = false;
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              submitLock.current = false;
              setSubmitting(false);
            },
          },
        };

        const instance = new RZP(options);
        instance.open();
        deferCheckoutIdleReset = true;
        return;
      }

      setError("Unexpected response from checkout service.");
    } catch {
      setError("Network error — try again.");
    } finally {
      if (!deferCheckoutIdleReset) {
        submitLock.current = false;
        setSubmitting(false);
      }
    }
  }

  const payLabel =
    gateway === "cod"
      ? "Place COD order"
      : gateway === "juspay"
        ? "Continue to Juspay"
        : gateway === "razorpay"
          ? "Pay with Razorpay"
          : "Pay with Stripe";

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
          <CardTitle as="h2" className="font-heading text-2xl tracking-tight">
            Order recorded
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Thanks, {name}.{" "}
            {doneDetail ?? "Our fulfilment desk will confirm dispatch windows shortly."}
          </p>
          <p>
            Confirmation correspondence goes to{" "}
            <span className="text-foreground">{email}</span>.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/account"
            className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
          >
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
          <CardTitle as="h2" className="font-heading text-2xl tracking-tight">
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
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-phone">Phone</Label>
              <Input
                id="co-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => {
                  const r = validatePhone(phone);
                  if (r.ok) setPhone(r.normalized);
                }}
                required
                disabled={submitting}
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
                disabled={submitting}
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
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-line2">Address line 2 (optional)</Label>
              <Input
                id="co-line2"
                autoComplete="address-line2"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <>
            <PaymentMethodSelector
              value={gateway}
              onChange={setGateway}
              availability={avail}
              disabled={submitting}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Availability reflects server configuration — unavailable rails stay visible but disabled so you know what to enable.
            </p>
          </>
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
              <p className="mt-1 text-foreground">{checkoutGatewayLabel(gateway)}</p>
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
              submitting ||
              (step === 0 &&
                (!name.trim() ||
                  !email.trim() ||
                  !validatePhone(phone).ok)) ||
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
              lines.some((l) => l.unitPrice == null) ||
              !avail[gateway]
            }
          >
            {submitting ? "Processing…" : payLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
