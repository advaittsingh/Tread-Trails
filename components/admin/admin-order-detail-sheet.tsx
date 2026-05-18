"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { formatInr } from "@/lib/format";
import { toastError } from "@/lib/toast";

import {
  AdminFormSection,
  adminSheetContentClass,
  adminTextareaClass,
} from "@/components/admin/admin-edit-sheet";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type OrderDetail = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string;
  items: unknown;
  shippingAddress: unknown;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  juspayGatewayOrderId: string | null;
  juspayCheckoutOrderRef: string | null;
  fulfilmentNotes: string;
  createdAt: string;
};

type Props = {
  orderId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export function AdminOrderDetailSheet({ orderId, onClose, onUpdated }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        if (!cancelled) {
          const o = data.order as OrderDetail;
          setOrder(o);
          setNotes(o.fulfilmentNotes ?? "");
        }
      } catch (e) {
        if (!cancelled) {
          toastError(
            "Could not load order",
            e instanceof Error ? e.message : "Error"
          );
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, onClose]);

  async function saveNotes() {
    if (!orderId) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfilmentNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdated?.();
    } catch (e) {
      toastError(
        "Could not save notes",
        e instanceof Error ? e.message : "Error"
      );
    } finally {
      setSavingNotes(false);
    }
  }

  const stripeDash = order?.stripePaymentIntentId
    ? `https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`
    : order?.stripeCheckoutSessionId
      ? `https://dashboard.stripe.com/checkout/sessions/${order.stripeCheckoutSessionId}`
      : null;

  return (
    <Sheet open={Boolean(orderId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent showCloseButton className={adminSheetContentClass}>
        <SheetHeader className="shrink-0 border-b border-zinc-800 px-6 py-5 text-left">
          <SheetTitle className="font-heading text-xl tracking-tight text-white">
            Order detail
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl bg-zinc-800" />
          ) : order ? (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <AdminStatusBadge status={order.status} />
                <span className="text-xs capitalize text-zinc-500">
                  {order.paymentMethod}
                </span>
                <span className="font-heading text-lg text-white tabular-nums">
                  {formatInr(order.total) ?? "—"}
                </span>
              </div>

              <AdminFormSection title="Customer">
                <p className="text-zinc-100">{order.customerName}</p>
                <p className="text-zinc-400">{order.customerEmail}</p>
                <p className="text-zinc-400">{order.customerPhone}</p>
              </AdminFormSection>

              <AdminFormSection
                title="Line items"
                description="Raw cart payload from checkout."
                defaultOpen={false}
              >
                <pre className="max-h-48 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-300">
                  {JSON.stringify(order.items, null, 2)}
                </pre>
              </AdminFormSection>

              <AdminFormSection title="Shipping address" defaultOpen={false}>
                <pre className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-300">
                  {JSON.stringify(order.shippingAddress, null, 2)}
                </pre>
              </AdminFormSection>

              <AdminFormSection
                title="Payment references"
                description="Gateway IDs for support lookups."
                defaultOpen={false}
              >
                <ul className="space-y-1 font-mono text-xs text-zinc-400">
                  {order.stripeCheckoutSessionId ? (
                    <li>Stripe session: {order.stripeCheckoutSessionId}</li>
                  ) : null}
                  {order.stripePaymentIntentId ? (
                    <li>Stripe PI: {order.stripePaymentIntentId}</li>
                  ) : null}
                  {order.razorpayOrderId ? (
                    <li>Razorpay order: {order.razorpayOrderId}</li>
                  ) : null}
                  {order.razorpayPaymentId ? (
                    <li>Razorpay payment: {order.razorpayPaymentId}</li>
                  ) : null}
                  {order.juspayGatewayOrderId ? (
                    <li>Juspay gateway: {order.juspayGatewayOrderId}</li>
                  ) : null}
                  {order.juspayCheckoutOrderRef ? (
                    <li>Juspay ref: {order.juspayCheckoutOrderRef}</li>
                  ) : null}
                </ul>
                {stripeDash ? (
                  <Link
                    href={stripeDash}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-brand-gold-dark underline"
                  >
                    Open in Stripe Dashboard
                  </Link>
                ) : null}
              </AdminFormSection>

              <AdminFormSection title="Fulfilment notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className={adminTextareaClass}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={savingNotes}
                  onClick={() => void saveNotes()}
                  className="bg-brand-maroon-light hover:bg-brand-maroon"
                >
                  {savingNotes ? "Saving…" : "Save notes"}
                </Button>
              </AdminFormSection>

              <p className="text-[11px] text-zinc-600">
                Created {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
