"use client";

import { cn } from "@/lib/utils";

export type CheckoutGateway = "stripe" | "razorpay" | "juspay" | "cod";

export type GatewayAvailability = Record<CheckoutGateway, boolean>;

type MethodDef = {
  id: CheckoutGateway;
  title: string;
  description: string;
  unavailableTitle: string;
};

const METHODS: MethodDef[] = [
  {
    id: "stripe",
    title: "Stripe Checkout",
    description:
      "Cards, UPI, wallets, and BNPL where enabled — PCI handled by Stripe-hosted Checkout.",
    unavailableTitle: "Stripe",
  },
  {
    id: "razorpay",
    title: "Razorpay",
    description:
      "India-focused Checkout · cards, UPI, netbanking, and wallets when enabled on your Razorpay dashboard.",
    unavailableTitle: "Razorpay",
  },
  {
    id: "juspay",
    title: "Juspay",
    description:
      "Hosted payment page (Hyper · paymentPage) — redirects to Juspay, returns here after payment.",
    unavailableTitle: "Juspay",
  },
  {
    id: "cod",
    title: "Cash on delivery",
    description:
      "Pay when your shipment arrives — order stays pending until our desk confirms availability.",
    unavailableTitle: "Cash on delivery",
  },
];

type PaymentMethodSelectorProps = {
  value: CheckoutGateway;
  onChange: (gateway: CheckoutGateway) => void;
  availability: GatewayAvailability;
  disabled?: boolean;
};

export function PaymentMethodSelector({
  value,
  onChange,
  availability,
  disabled,
}: PaymentMethodSelectorProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="font-medium text-foreground">Payment method</legend>
      <div className="space-y-3">
        {METHODS.map((m) => {
          const enabled = availability[m.id];
          const selected = value === m.id;
          return (
            <div key={m.id} className="relative">
              <label
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 shadow-card transition",
                  enabled
                    ? "border-border/70 bg-muted/30 hover:border-primary/30 hover:shadow-card-hover has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
                    : "cursor-not-allowed border-border/40 bg-muted/15 opacity-60"
                )}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="checkout-gateway"
                    value={m.id}
                    checked={selected}
                    disabled={!enabled || disabled}
                    onChange={() => enabled && onChange(m.id)}
                    className="mt-1 size-4 shrink-0 accent-primary disabled:opacity-40"
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      {m.title}
                      {!enabled ? (
                        <span className="rounded-full border border-border/80 bg-background px-2 py-0.5 text-[10px] font-normal tracking-wide text-muted-foreground uppercase">
                          Unavailable
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {m.description}
                    </span>
                    {!enabled ? (
                      <span className="block text-[11px] leading-snug text-muted-foreground/90">
                        {m.id === "stripe"
                          ? "Set STRIPE_SECRET_KEY on the server."
                          : m.id === "razorpay"
                            ? "Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID."
                            : m.id === "juspay"
                              ? "Set JUSPAY_API_KEY, JUSPAY_MERCHANT_ID, and JUSPAY_PAYMENT_PAGE_CLIENT_ID."
                              : null}
                      </span>
                    ) : null}
                  </span>
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export function checkoutGatewayLabel(g: CheckoutGateway): string {
  const m = METHODS.find((x) => x.id === g);
  return m?.title ?? g;
}
