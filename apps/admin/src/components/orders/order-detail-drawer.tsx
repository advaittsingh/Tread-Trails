import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useOrderDetail } from "@/api/orders/hooks";
import { apiFetchJson } from "@/api/client";
import { AutomotiveBadges } from "./automotive-badges";
import { OrderTimeline } from "./order-timeline";
import { PaymentStatusBadge } from "./payment-status-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatInr, formatShortDate } from "@/lib/format";

const STATUSES = [
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const CARRIERS = [
  "Blue Dart",
  "Delhivery",
  "DTDC",
  "FedEx",
  "India Post",
  "Professional Couriers",
  "Self / studio pickup",
  "Other",
];

import type { ShippingAddress } from "@/api/orders/types";

function formatAddress(addr: ShippingAddress | null): string[] {
  if (!addr) return ["No address on file"];
  const lines = [addr.line1];
  if (addr.line2?.trim()) lines.push(addr.line2);
  lines.push(`${addr.city}, ${addr.region} ${addr.postal}`);
  return lines;
}

export function OrderDetailDrawer({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useOrderDetail(orderId);
  const order = q.data?.order;
  const timeline = q.data?.timeline ?? [];
  const internalNotes = q.data?.internalNotes ?? [];
  const automotive = q.data?.automotive;
  const compatibility = q.data?.vehicleCompatibility ?? [];

  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [fulfilmentNotes, setFulfilmentNotes] = useState("");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    setTrackingNumber(order.trackingNumber ?? "");
    setShippingCarrier(order.shippingCarrier ?? "");
    setFulfilmentNotes(order.fulfilmentNotes ?? "");
  }, [order]);

  const patchMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchJson(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Order updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const noteMut = useMutation({
    mutationFn: (body: { body: string }) =>
      apiFetchJson(`/api/admin/orders/${orderId}/notes`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setNoteBody("");
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Note added" });
    },
    onError: (e: Error) =>
      toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const paymentRefs = useMemo(() => {
    if (!order) return [];
    const refs: Array<{ label: string; value: string }> = [];
    if (order.stripePaymentIntentId)
      refs.push({ label: "Stripe PI", value: order.stripePaymentIntentId });
    if (order.razorpayPaymentId)
      refs.push({ label: "Razorpay", value: order.razorpayPaymentId });
    if (order.juspayGatewayOrderId)
      refs.push({ label: "Juspay", value: order.juspayGatewayOrderId });
    return refs;
  }, [order]);

  const paymentStatus =
    order?.status === "cancelled"
      ? "refunded"
      : order?.status === "pending"
        ? "unpaid"
        : "captured";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-stone-200 sticky top-0 bg-white z-10">
          <SheetTitle className="text-left text-base font-semibold">
            {order ? (
              <span className="font-mono text-sm">#{order.id.slice(0, 12)}…</span>
            ) : (
              "Order details"
            )}
          </SheetTitle>
          {order && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StatusBadge status={order.status} />
              <PaymentStatusBadge status={paymentStatus} />
              {automotive && <AutomotiveBadges automotive={automotive} compact />}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 px-6 py-4 space-y-6">
          {q.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {order && (
            <>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-3">
                  Fulfilment timeline
                </h3>
                <OrderTimeline order={order} />
              </section>

              <section className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Customer
                  </h3>
                  <p className="font-medium text-stone-900">{order.customerName}</p>
                  <p className="text-stone-600">{order.customerEmail}</p>
                  <p className="text-stone-600">{order.customerPhone}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Vehicle
                  </h3>
                  <p className="text-stone-900">
                    {automotive?.vehicleLabel ?? "—"}
                  </p>
                  {automotive?.primaryBrand && (
                    <p className="text-stone-500 text-xs mt-1">
                      Brand context: {automotive.primaryBrand}
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                  Ordered products
                </h3>
                <ul className="space-y-2 border border-stone-100 rounded-lg divide-y divide-stone-100">
                  {order.items.map((line) => (
                    <li
                      key={`${line.productSlug}-${line.variantId}`}
                      className="px-3 py-2 text-sm flex justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium">{line.name}</p>
                        <p className="text-xs text-stone-500">
                          {line.variantLabel} × {line.quantity}
                        </p>
                      </div>
                      <span className="tabular-nums font-medium shrink-0">
                        {formatInr(line.unitPrice * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-right text-sm font-semibold mt-2 tabular-nums">
                  Total {formatInr(order.total)}
                </p>
              </section>

              {compatibility.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Fitment map
                  </h3>
                  <ul className="text-xs space-y-2">
                    {compatibility.map((row) => (
                      <li
                        key={row.productSlug}
                        className="rounded-md bg-stone-50 px-3 py-2 border border-stone-100"
                      >
                        <span className="font-medium">{row.productName}</span>
                        <p className="text-stone-600 mt-0.5">
                          {row.vehicles.length > 0
                            ? row.vehicles.map((v) => v.vehicleName).join(", ")
                            : "Unmapped"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                  Payment
                </h3>
                <p className="text-sm capitalize">{order.paymentMethod}</p>
                {paymentRefs.map((r) => (
                  <p key={r.label} className="text-xs font-mono text-stone-600 mt-1 break-all">
                    {r.label}: {r.value}
                  </p>
                ))}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                  Shipping
                </h3>
                {formatAddress(order.shippingAddress).map((l) => (
                  <p key={l} className="text-sm text-stone-700">
                    {l}
                  </p>
                ))}
              </section>

              <section className="space-y-3 border-t border-stone-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Fulfilment controls
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Carrier</Label>
                    <Select value={shippingCarrier || ""} onValueChange={setShippingCarrier}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARRIERS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Tracking</Label>
                  <Input
                    className="h-9"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Fulfilment notes</Label>
                  <Textarea
                    rows={2}
                    value={fulfilmentNotes}
                    onChange={(e) => setFulfilmentNotes(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={patchMut.isPending}
                  onClick={() =>
                    patchMut.mutate({
                      status,
                      trackingNumber: trackingNumber || null,
                      shippingCarrier: shippingCarrier || null,
                      fulfilmentNotes,
                    })
                  }
                >
                  Save fulfilment
                </Button>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                  Internal notes
                </h3>
                <ul className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {internalNotes.map((n) => (
                    <li
                      key={n.id}
                      className="text-xs rounded-md bg-amber-50/80 border border-amber-100 px-3 py-2"
                    >
                      <p className="text-stone-800">{n.body}</p>
                      <p className="text-stone-500 mt-1">
                        {n.adminName ?? "Admin"} · {formatShortDate(n.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
                <Textarea
                  rows={2}
                  placeholder="Add internal note…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  disabled={!noteBody.trim() || noteMut.isPending}
                  onClick={() => noteMut.mutate({ body: noteBody.trim() })}
                >
                  Add note
                </Button>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                  Activity
                </h3>
                <ol className="space-y-2 text-xs border-l-2 border-stone-200 pl-3">
                  {timeline.map((ev) => (
                    <li key={ev.id}>
                      <p className="font-medium text-stone-900">{ev.title}</p>
                      {ev.detail && (
                        <p className="text-stone-500">{ev.detail}</p>
                      )}
                      <p className="text-stone-400">{formatShortDate(ev.at)}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <Button variant="outline" size="sm" asChild>
                <Link to={`/orders/${order.id}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Full page view
                </Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
