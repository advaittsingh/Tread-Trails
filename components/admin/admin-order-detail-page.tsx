"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

import { useConfirmation } from "@/contexts/confirmation-context";
import type {
  AdminOrderDetail,
  OrderTimelineEvent,
} from "@/lib/admin/order-detail";
import { SHIPPING_CARRIERS, formatShippingAddress } from "@/lib/admin/order-detail";
import { formatInr } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import {
  AdminFormSection,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/admin-form-ui";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type PatchBody = {
  status?: string;
  fulfilmentNotes?: string;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
};

type Props = { orderId: string };

function timelineDotClass(kind: OrderTimelineEvent["kind"]) {
  switch (kind) {
    case "payment":
      return "bg-emerald-500 ring-emerald-500/30";
    case "shipped":
      return "bg-sky-500 ring-sky-500/30";
    case "delivered":
      return "bg-violet-500 ring-violet-500/30";
    case "cancelled":
      return "bg-rose-500 ring-rose-500/30";
    case "admin":
      return "bg-amber-500 ring-amber-500/30";
    default:
      return "bg-zinc-500 ring-zinc-500/30";
  }
}

export function AdminOrderDetailPage({ orderId }: Props) {
  const { confirmAction } = useConfirmation();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load order");
      const o = data.order as AdminOrderDetail;
      setOrder(o);
      setTimeline((data.timeline as OrderTimelineEvent[]) ?? []);
      setNotes(o.fulfilmentNotes ?? "");
      setTrackingNumber(o.trackingNumber ?? "");
      setShippingCarrier(o.shippingCarrier ?? "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchOrder = useCallback(
    async (body: PatchBody, successMessage: string) => {
      if (!order) return false;
      const prev = order;
      const optimistic: AdminOrderDetail = {
        ...order,
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.fulfilmentNotes !== undefined
          ? { fulfilmentNotes: body.fulfilmentNotes }
          : {}),
        ...(body.trackingNumber !== undefined
          ? { trackingNumber: body.trackingNumber }
          : {}),
        ...(body.shippingCarrier !== undefined
          ? { shippingCarrier: body.shippingCarrier }
          : {}),
      };
      setOrder(optimistic);
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Update failed");
        setOrder(data.order as AdminOrderDetail);
        setTimeline((data.timeline as OrderTimelineEvent[]) ?? []);
        toastSuccess(successMessage);
        return true;
      } catch (e) {
        setOrder(prev);
        toastError(
          "Update failed",
          e instanceof Error ? e.message : "Error"
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [order, orderId]
  );

  async function confirmStatus(next: string, label: string) {
    if (!order || order.status === next) return;
    if (next === "cancelled") {
      const ok = await confirmAction({
        title: "Cancel this order?",
        description:
          "Fulfilment will stop. Payment is not automatically refunded from this panel.",
        confirmLabel: "Cancel order",
        contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
      });
      if (!ok) return;
    }
    await patchOrder({ status: next }, label);
  }

  async function saveFulfilment() {
    await patchOrder(
      {
        fulfilmentNotes: notes,
        trackingNumber: trackingNumber.trim() || null,
        shippingCarrier: shippingCarrier.trim() || null,
      },
      "Fulfilment details saved"
    );
  }

  const stripeDash = useMemo(() => {
    if (!order) return null;
    if (order.stripePaymentIntentId) {
      return `https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`;
    }
    if (order.stripeCheckoutSessionId) {
      return `https://dashboard.stripe.com/checkout/sessions/${order.stripeCheckoutSessionId}`;
    }
    return null;
  }, [order]);

  const taxNote =
    order && order.subtotal !== order.total
      ? `Line subtotal ${formatInr(order.subtotal)}; order total ${formatInr(order.total)} (adjustment or rounding may apply).`
      : "Catalog prices are tax-inclusive (GST not itemized per line).";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
        <Skeleton className="h-8 w-48 rounded-lg bg-zinc-800" />
        <Skeleton className="h-40 w-full rounded-2xl bg-zinc-800" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl bg-zinc-800" />
          <Skeleton className="h-64 rounded-2xl bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="size-4" />
          Back to orders
        </Link>
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error ?? "Order not found"}
        </p>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  const canShip = order.status === "paid";
  const canDeliver = order.status === "shipped";
  const canCancel = !["cancelled", "delivered"].includes(order.status);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 pb-24 lg:p-10">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        <ArrowLeft className="size-4" />
        Orders
      </Link>

      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge status={order.status} />
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] capitalize text-zinc-400">
              {order.paymentMethod}
            </span>
          </div>
          <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            {formatInr(order.total) ?? "—"}
          </h1>
          <p className="font-mono text-xs text-zinc-500">
            {order.id}
            <button
              type="button"
              className="ml-2 inline-flex align-middle text-zinc-600 hover:text-emerald-400"
              aria-label="Copy order ID"
              onClick={() => {
                void navigator.clipboard.writeText(order.id);
                toastSuccess("Copied order ID");
              }}
            >
              <Copy className="size-3.5" />
            </button>
          </p>
          <p className="text-sm text-zinc-500">
            Placed {new Date(order.createdAt).toLocaleString()} · Updated{" "}
            {new Date(order.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={saving || !canShip}
            className="bg-sky-600 hover:bg-sky-500"
            onClick={() => void confirmStatus("shipped", "Marked as shipped")}
          >
            <Truck className="mr-1.5 size-4" />
            Mark shipped
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || !canDeliver}
            className="bg-violet-600 hover:bg-violet-500"
            onClick={() => void confirmStatus("delivered", "Marked as delivered")}
          >
            <CheckCircle2 className="mr-1.5 size-4" />
            Mark delivered
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving || !canCancel}
            className="border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
            onClick={() => void confirmStatus("cancelled", "Order cancelled")}
          >
            <XCircle className="mr-1.5 size-4" />
            Cancel
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-heading text-sm tracking-[0.15em] text-zinc-400 uppercase">
              Line items ({order.itemQuantity} units)
            </h2>
            <ul className="mt-4 divide-y divide-zinc-800/80">
              {order.items.map((line) => (
                <li
                  key={`${line.productSlug}-${line.variantId}`}
                  className="flex gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                    {line.image ? (
                      <Image
                        src={line.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-zinc-600">
                        <Package className="size-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.productSlug}`}
                      target="_blank"
                      className="font-medium text-zinc-100 hover:text-emerald-300"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {line.variantLabel} · {line.productSlug}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Qty {line.quantity} × {formatInr(line.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-zinc-200">
                    {formatInr(line.unitPrice * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-zinc-800 pt-4 text-sm">
              <div className="flex justify-between text-zinc-400">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-zinc-200">
                  {formatInr(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between text-zinc-500">
                <dt>Taxes</dt>
                <dd className="max-w-[min(100%,280px)] text-right text-xs">
                  {taxNote}
                </dd>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-2 font-medium text-white">
                <dt>Order total</dt>
                <dd className="tabular-nums">{formatInr(order.total)}</dd>
              </div>
            </dl>
          </section>

          <AdminFormSection title="Fulfilment & tracking">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-400">Carrier</Label>
                <select
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  className={adminSelectClass}
                >
                  <option value="">Select carrier…</option>
                  {SHIPPING_CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Tracking number</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="AWB / tracking ID"
                  className={adminInputClass}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Admin notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Internal fulfilment notes, refund context, studio handoff…"
                className={adminTextareaClass}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void saveFulfilment()}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {saving ? "Saving…" : "Save fulfilment"}
            </Button>
          </AdminFormSection>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-heading text-sm tracking-[0.15em] text-zinc-400 uppercase">
              Customer
            </h2>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium text-zinc-100">{order.customerName}</p>
              <a
                href={`mailto:${order.customerEmail}`}
                className="block text-emerald-400/90 hover:underline"
              >
                {order.customerEmail}
              </a>
              <a
                href={`tel:${order.customerPhone}`}
                className="block text-zinc-400 hover:text-zinc-200"
              >
                {order.customerPhone}
              </a>
              {order.guestEmail ? (
                <p className="text-xs text-zinc-600">
                  Guest checkout · {order.guestEmail}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-heading text-sm tracking-[0.15em] text-zinc-400 uppercase">
              Ship to
            </h2>
            {order.shippingAddress ? (
              <address className="mt-3 space-y-0.5 text-sm not-italic text-zinc-300">
                {formatShippingAddress(order.shippingAddress).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">No address on file</p>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-heading text-sm tracking-[0.15em] text-zinc-400 uppercase">
              Payment
            </h2>
            <ul className="mt-3 space-y-2 font-mono text-[11px] text-zinc-400">
              {order.stripeCheckoutSessionId ? (
                <li className="break-all">
                  Stripe session: {order.stripeCheckoutSessionId}
                </li>
              ) : null}
              {order.stripePaymentIntentId ? (
                <li className="break-all">
                  Stripe PI: {order.stripePaymentIntentId}
                </li>
              ) : null}
              {order.razorpayOrderId ? (
                <li className="break-all">Razorpay order: {order.razorpayOrderId}</li>
              ) : null}
              {order.razorpayPaymentId ? (
                <li className="break-all">
                  Razorpay payment: {order.razorpayPaymentId}
                </li>
              ) : null}
              {order.juspayGatewayOrderId ? (
                <li className="break-all">
                  Juspay gateway: {order.juspayGatewayOrderId}
                </li>
              ) : null}
              {order.juspayCheckoutOrderRef ? (
                <li className="break-all">Juspay ref: {order.juspayCheckoutOrderRef}</li>
              ) : null}
            </ul>
            {stripeDash ? (
              <Link
                href={stripeDash}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
              >
                Stripe Dashboard
                <ExternalLink className="size-3" />
              </Link>
            ) : null}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-heading text-sm tracking-[0.15em] text-zinc-400 uppercase">
              Timeline
            </h2>
            <ol className="relative mt-4 space-y-4 border-l border-zinc-800 pl-4">
              {timeline.map((ev) => (
                <li key={ev.id} className="relative">
                  <span
                    className={cn(
                      "absolute top-1 -left-[21px] size-2.5 rounded-full ring-2",
                      timelineDotClass(ev.kind)
                    )}
                  />
                  <p className="text-sm font-medium text-zinc-200">{ev.title}</p>
                  {ev.detail ? (
                    <p className="text-xs text-zinc-500">{ev.detail}</p>
                  ) : null}
                  <time className="text-[11px] text-zinc-600">
                    {new Date(ev.at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ol>
          </section>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
              Override status
            </Label>
            <select
              value={order.status}
              disabled={saving}
              onChange={(e) => void confirmStatus(e.target.value, "Status updated")}
              className={cn(adminSelectClass, "mt-2")}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </aside>
      </div>
    </div>
  );
}
