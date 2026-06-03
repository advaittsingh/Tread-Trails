import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useAdminQuery } from "@/api/admin";
import { apiFetchJson } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Circle } from "lucide-react";

type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal: string;
};

type OrderLine = {
  productSlug: string;
  variantId: string;
  variantLabel: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
};

type OrderDetail = {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: ShippingAddress | null;
  items: OrderLine[];
  lineCount: number;
  itemQuantity: number;
  subtotal: number;
  total: number;
  currency: string;
  status: string;
  paymentMethod: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  juspayGatewayOrderId: string | null;
  juspayCheckoutOrderRef: string | null;
  fulfilmentNotes: string;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  paidAt: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type TimelineEvent = {
  id: string;
  kind: string;
  title: string;
  detail?: string;
  at: string;
};

type InternalNote = {
  id: string;
  body: string;
  adminName: string | null;
  createdAt: string;
};

type OrderDetailResponse = {
  order: OrderDetail;
  timeline: TimelineEvent[];
  internalNotes: InternalNote[];
};

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

const TIMELINE_STEPS = [
  { key: "created", label: "Created", field: "createdAt" as const },
  { key: "paid", label: "Paid", field: "paidAt" as const },
  { key: "packed", label: "Packed", field: "packedAt" as const },
  { key: "shipped", label: "Shipped", field: "shippedAt" as const },
  { key: "delivered", label: "Delivered", field: "deliveredAt" as const },
];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function formatAddress(addr: ShippingAddress | null): string[] {
  if (!addr) return ["No address on file"];
  const lines = [addr.line1];
  if (addr.line2?.trim()) lines.push(addr.line2);
  lines.push(`${addr.city}, ${addr.region} ${addr.postal}`);
  return lines;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "delivered") return "default";
  if (status === "cancelled") return "destructive";
  if (status === "pending") return "outline";
  return "secondary";
}

function stepState(
  stepKey: string,
  order: OrderDetail
): "done" | "current" | "pending" | "cancelled" {
  if (order.status === "cancelled") {
    if (stepKey === "created") return "done";
    return "cancelled";
  }

  const statusRank: Record<string, number> = {
    pending: 0,
    paid: 1,
    packed: 2,
    shipped: 3,
    delivered: 4,
  };
  const stepRank: Record<string, number> = {
    created: 0,
    paid: 1,
    packed: 2,
    shipped: 3,
    delivered: 4,
  };

  const current = statusRank[order.status] ?? 0;
  const step = stepRank[stepKey] ?? 0;

  if (step < current) return "done";
  if (step === current) return "current";
  return "pending";
}

function stepTimestamp(stepKey: string, order: OrderDetail): string | null {
  switch (stepKey) {
    case "created":
      return order.createdAt;
    case "paid":
      return order.paidAt;
    case "packed":
      return order.packedAt;
    case "shipped":
      return order.shippedAt;
    case "delivered":
      return order.deliveredAt;
    default:
      return null;
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();

  const q = useAdminQuery<OrderDetailResponse>(
    `/api/admin/orders/${id ?? ""}`,
    undefined,
    { enabled: Boolean(id) }
  );

  const order = q.data?.order;
  const timeline = q.data?.timeline ?? [];
  const internalNotes = q.data?.internalNotes ?? [];

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
      apiFetchJson(`/api/admin/orders/${id}`, {
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
      apiFetchJson(`/api/admin/orders/${id}/notes`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setNoteBody("");
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Note added" });
    },
    onError: (e: Error) =>
      toast({ title: "Failed to add note", description: e.message, variant: "destructive" }),
  });

  const paymentRefs = useMemo(() => {
    if (!order) return [];
    const refs: Array<{ label: string; value: string }> = [];
    if (order.stripePaymentIntentId) {
      refs.push({ label: "Stripe payment intent", value: order.stripePaymentIntentId });
    }
    if (order.stripeCheckoutSessionId) {
      refs.push({ label: "Stripe checkout session", value: order.stripeCheckoutSessionId });
    }
    if (order.razorpayPaymentId) {
      refs.push({ label: "Razorpay payment", value: order.razorpayPaymentId });
    }
    if (order.razorpayOrderId) {
      refs.push({ label: "Razorpay order", value: order.razorpayOrderId });
    }
    if (order.juspayGatewayOrderId) {
      refs.push({ label: "Juspay gateway order", value: order.juspayGatewayOrderId });
    }
    if (order.juspayCheckoutOrderRef) {
      refs.push({ label: "Juspay checkout ref", value: order.juspayCheckoutOrderRef });
    }
    return refs;
  }, [order]);

  if (!id) {
    return (
      <CardContent className="px-3 lg:px-6 pb-6">
        <p className="text-sm text-stone-600">Missing order ID.</p>
      </CardContent>
    );
  }

  if (q.isLoading) {
    return (
      <CardContent className="px-3 lg:px-6 pb-6">
        <p className="text-sm text-stone-600">Loading order…</p>
      </CardContent>
    );
  }

  if (q.error || !order) {
    return (
      <CardContent className="px-3 lg:px-6 pb-6 space-y-3">
        <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <p className="text-sm text-red-700">
          {(q.error as Error)?.message ?? "Order not found."}
        </p>
      </CardContent>
    );
  }

  const shippingLines = formatAddress(order.shippingAddress);

  return (
    <>
      <CardContent className="px-3 lg:px-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-stone-500">{order.id}</span>
            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
          </div>
        </div>
      </CardContent>

      <CardContent className="px-3 lg:px-6 pb-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-stone-200 p-4">
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Customer</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-stone-500">Name</dt>
                  <dd className="text-stone-900">{order.customerName}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Email</dt>
                  <dd className="text-stone-900">{order.customerEmail}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Phone</dt>
                  <dd className="text-stone-900">{order.customerPhone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Account</dt>
                  <dd className="text-stone-900">
                    {order.userId ? `User ${order.userId}` : order.guestEmail ? `Guest (${order.guestEmail})` : "Guest checkout"}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <section className="rounded-lg border border-stone-200 p-4">
                <h2 className="text-sm font-semibold text-stone-900 mb-3">Shipping address</h2>
                <address className="not-italic text-sm text-stone-700 space-y-0.5">
                  {shippingLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </address>
              </section>

              <section className="rounded-lg border border-stone-200 p-4">
                <h2 className="text-sm font-semibold text-stone-900 mb-3">Billing address</h2>
                <p className="text-xs text-stone-500 mb-2">Same as shipping</p>
                <address className="not-italic text-sm text-stone-700 space-y-0.5">
                  {shippingLines.map((line) => (
                    <div key={`bill-${line}`}>{line}</div>
                  ))}
                </address>
              </section>
            </div>

            <section className="rounded-lg border border-stone-200 overflow-hidden">
              <div className="border-b border-stone-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-stone-900">
                  Order items ({order.itemQuantity} units)
                </h2>
              </div>
              <div className="divide-y divide-stone-100">
                {order.items.map((line) => (
                  <div
                    key={`${line.productSlug}-${line.variantId}`}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{line.name}</p>
                      <p className="text-stone-500">{line.variantLabel}</p>
                      <p className="text-xs text-stone-400 font-mono">{line.productSlug}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-stone-900">× {line.quantity}</p>
                      <p className="text-stone-600">
                        {formatMoney(line.unitPrice * line.quantity, order.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-200 px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-stone-900">
                  <span>Total</span>
                  <span>{formatMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-stone-200 p-4">
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Payment</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-stone-500">Method</dt>
                  <dd className="text-stone-900 uppercase">{order.paymentMethod}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Currency</dt>
                  <dd className="text-stone-900">{order.currency}</dd>
                </div>
              </dl>
              {paymentRefs.length > 0 ? (
                <dl className="mt-4 space-y-2 text-sm">
                  {paymentRefs.map((ref) => (
                    <div key={ref.label}>
                      <dt className="text-stone-500">{ref.label}</dt>
                      <dd className="font-mono text-xs text-stone-800 break-all">{ref.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm text-stone-500">No gateway reference IDs recorded.</p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-stone-200 p-4">
              <h2 className="text-sm font-semibold text-stone-900 mb-4">Order timeline</h2>
              {order.status === "cancelled" ? (
                <p className="text-sm text-red-700 mb-4">
                  Cancelled {order.cancelledAt ? formatDate(order.cancelledAt) : ""}
                </p>
              ) : null}
              <ol className="space-y-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const state = stepState(step.key, order);
                  const ts = stepTimestamp(step.key, order);
                  const isLast = idx === TIMELINE_STEPS.length - 1;

                  return (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={
                            state === "done"
                              ? "flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white"
                              : state === "current"
                                ? "flex h-7 w-7 items-center justify-center rounded-full border-2 border-stone-900 bg-white"
                                : state === "cancelled"
                                  ? "flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-stone-400"
                                  : "flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-300"
                          }
                        >
                          {state === "done" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                        </div>
                        {!isLast ? (
                          <div
                            className={
                              state === "done" ? "w-px flex-1 bg-stone-900 min-h-6" : "w-px flex-1 bg-stone-200 min-h-6"
                            }
                          />
                        ) : null}
                      </div>
                      <div className="pb-5 pt-0.5">
                        <p
                          className={
                            state === "pending" || state === "cancelled"
                              ? "text-sm text-stone-400"
                              : "text-sm font-medium text-stone-900"
                          }
                        >
                          {step.label}
                        </p>
                        {ts ? (
                          <p className="text-xs text-stone-500">{formatDate(ts)}</p>
                        ) : state === "pending" ? (
                          <p className="text-xs text-stone-400">Pending</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {timeline.length > 0 ? (
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <p className="text-xs font-medium text-stone-500 mb-2">Activity log</p>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {[...timeline].reverse().map((ev) => (
                      <li key={ev.id} className="text-xs">
                        <span className="text-stone-900">{ev.title}</span>
                        {ev.detail ? (
                          <span className="text-stone-500"> — {ev.detail}</span>
                        ) : null}
                        <div className="text-stone-400">{formatDate(ev.at)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="rounded-lg border border-stone-200 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-stone-900">Fulfilment</h2>
              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="order-status">
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
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Select
                  value={shippingCarrier || "__none__"}
                  onValueChange={(v) => setShippingCarrier(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="carrier">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {CARRIERS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fulfilment-notes">Fulfilment notes</Label>
                <Textarea
                  id="fulfilment-notes"
                  value={fulfilmentNotes}
                  onChange={(e) => setFulfilmentNotes(e.target.value)}
                  rows={3}
                  placeholder="Customer-visible fulfilment notes"
                />
              </div>
              <Button
                className="w-full"
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

            <section className="rounded-lg border border-stone-200 p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Internal notes</h2>
                <p className="text-xs text-stone-500">Admin only — not visible to customers</p>
              </div>
              {internalNotes.length === 0 ? (
                <p className="text-sm text-stone-500">No notes yet.</p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {internalNotes.map((note) => (
                    <li key={note.id} className="rounded-md bg-stone-50 p-3 text-sm">
                      <p className="text-stone-800 whitespace-pre-wrap">{note.body}</p>
                      <p className="mt-2 text-xs text-stone-500">
                        {note.adminName ?? "Admin"} · {formatDate(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
                placeholder="Add an internal note…"
              />
              <Button
                variant="secondary"
                className="w-full"
                disabled={!noteBody.trim() || noteMut.isPending}
                onClick={() => noteMut.mutate({ body: noteBody.trim() })}
              >
                Add note
              </Button>
            </section>
          </div>
        </div>
      </CardContent>
    </>
  );
}
