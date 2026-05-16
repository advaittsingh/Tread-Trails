"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Copy,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";

import { useConfirmation } from "@/contexts/confirmation-context";
import type {
  AdminBookingDetail,
  BookingTimelineEvent,
} from "@/lib/admin/booking-detail";
import { formatBookingSlotLabel } from "@/lib/booking/slots";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { ADMIN_CONFIRM_DIALOG_CLASS } from "@/components/admin/admin-confirm-styles";
import {
  AdminFormSection,
  adminTextareaClass,
} from "@/components/admin/admin-form-ui";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type PatchBody = {
  status?: string;
  adminNotes?: string;
};

type Props = { bookingId: string };

function timelineDotClass(kind: BookingTimelineEvent["kind"]) {
  switch (kind) {
    case "confirmed":
      return "bg-emerald-500 ring-emerald-500/30";
    case "completed":
      return "bg-violet-500 ring-violet-500/30";
    case "cancelled":
      return "bg-rose-500 ring-rose-500/30";
    case "admin":
      return "bg-amber-500 ring-amber-500/30";
    default:
      return "bg-zinc-500 ring-zinc-500/30";
  }
}

export function AdminBookingDetailPage({ bookingId }: Props) {
  const { confirmAction } = useConfirmation();
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [timeline, setTimeline] = useState<BookingTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load booking");
      const b = data.booking as AdminBookingDetail;
      setBooking(b);
      setTimeline((data.timeline as BookingTimelineEvent[]) ?? []);
      setAdminNotes(b.adminNotes ?? "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchBooking = useCallback(
    async (body: PatchBody, successMessage: string) => {
      if (!booking) return false;
      const prev = booking;
      const optimistic: AdminBookingDetail = {
        ...booking,
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.adminNotes !== undefined ? { adminNotes: body.adminNotes } : {}),
      };
      setBooking(optimistic);
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Update failed");
        setBooking(data.booking as AdminBookingDetail);
        setTimeline((data.timeline as BookingTimelineEvent[]) ?? []);
        toastSuccess(successMessage);
        return true;
      } catch (e) {
        setBooking(prev);
        toastError(
          "Update failed",
          e instanceof Error ? e.message : "Error"
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [booking, bookingId]
  );

  async function confirmStatus(next: string, label: string) {
    if (!booking || booking.status === next) return;
    if (next === "cancelled") {
      const ok = await confirmAction({
        title: "Cancel this booking?",
        description:
          "The customer should be notified separately. The bay slot will be released for ops planning.",
        confirmLabel: "Cancel booking",
        contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
      });
      if (!ok) return;
    }
    if (next === "completed") {
      const ok = await confirmAction({
        title: "Mark visit as completed?",
        description: "Use when the bay session has finished successfully.",
        confirmLabel: "Mark completed",
        contentClassName: ADMIN_CONFIRM_DIALOG_CLASS,
      });
      if (!ok) return;
    }
    await patchBooking({ status: next }, label);
  }

  async function saveNotes() {
    await patchBooking({ adminNotes }, "Admin notes saved");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
        <Skeleton className="h-8 w-48 rounded-lg bg-zinc-800" />
        <Skeleton className="h-48 w-full rounded-2xl bg-zinc-800" />
        <Skeleton className="h-64 w-full rounded-2xl bg-zinc-800" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="size-4" />
          Back to bookings
        </Link>
        <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error ?? "Booking not found"}
        </p>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  const canConfirm = booking.status === "pending";
  const canComplete =
    booking.status === "confirmed" || booking.status === "pending";
  const canCancel = !["cancelled", "completed"].includes(booking.status);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 pb-24 lg:p-10">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        <ArrowLeft className="size-4" />
        Bookings
      </Link>

      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge status={booking.status} />
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[11px] text-zinc-400">
              {booking.vehicleName}
            </span>
          </div>
          <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
            {booking.service}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
            <CalendarClock className="size-4 text-emerald-500/80" />
            <span className="font-medium">
              {booking.date} · {formatBookingSlotLabel(booking.time)}
            </span>
            <span className="text-zinc-600">({booking.time})</span>
          </p>
          <p className="font-mono text-xs text-zinc-500">
            {booking.id}
            <button
              type="button"
              className="ml-2 inline-flex align-middle text-zinc-600 hover:text-emerald-400"
              aria-label="Copy booking ID"
              onClick={() => {
                void navigator.clipboard.writeText(booking.id);
                toastSuccess("Copied booking ID");
              }}
            >
              <Copy className="size-3.5" />
            </button>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={saving || !canConfirm}
            className="bg-emerald-600 hover:bg-emerald-500"
            onClick={() => void confirmStatus("confirmed", "Booking confirmed")}
          >
            <CheckCircle2 className="mr-1.5 size-4" />
            Confirm
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || !canComplete}
            className="bg-violet-600 hover:bg-violet-500"
            onClick={() => void confirmStatus("completed", "Marked completed")}
          >
            <CheckCircle2 className="mr-1.5 size-4" />
            Mark completed
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving || !canCancel}
            className="border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
            onClick={() => void confirmStatus("cancelled", "Booking cancelled")}
          >
            <XCircle className="mr-1.5 size-4" />
            Cancel
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-heading text-sm tracking-[0.15em] text-zinc-400 uppercase">
              Appointment
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] tracking-wide text-zinc-500 uppercase">
                  Vehicle
                </dt>
                <dd className="mt-1 text-zinc-100">{booking.vehicleName}</dd>
                <dd className="font-mono text-xs text-zinc-600">
                  {booking.vehicleSlug}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-zinc-500 uppercase">
                  Service
                </dt>
                <dd className="mt-1 text-zinc-100">{booking.service}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-zinc-500 uppercase">
                  Slot
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {booking.date} · {formatBookingSlotLabel(booking.time)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-zinc-500 uppercase">
                  Requested
                </dt>
                <dd className="mt-1 text-zinc-300">
                  {new Date(booking.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
            {booking.customerMessage ? (
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[11px] tracking-wide text-zinc-500 uppercase">
                  Customer message
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                  {booking.customerMessage}
                </p>
              </div>
            ) : null}
          </section>

          <AdminFormSection title="Admin notes">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={5}
              placeholder="Bay assignment, parts prep, follow-up calls…"
              className={adminTextareaClass}
            />
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void saveNotes()}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {saving ? "Saving…" : "Save notes"}
            </Button>
          </AdminFormSection>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-heading text-sm tracking-[0.15em] text-zinc-400 uppercase">
              Customer
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              <p className="font-medium text-zinc-100">{booking.contactName}</p>
              <a
                href={`mailto:${booking.contactEmail}`}
                className="flex items-center gap-2 text-emerald-400/90 hover:underline"
              >
                <Mail className="size-4 shrink-0" />
                {booking.contactEmail}
              </a>
              <a
                href={`tel:${booking.contactPhone}`}
                className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100"
              >
                <Phone className="size-4 shrink-0" />
                {booking.contactPhone}
              </a>
              {booking.userId ? (
                <p className="font-mono text-xs text-zinc-600">
                  User {booking.userId}
                </p>
              ) : (
                <p className="text-xs text-zinc-600">Guest request</p>
              )}
            </div>
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
              value={booking.status}
              disabled={saving}
              onChange={(e) =>
                void confirmStatus(e.target.value, "Status updated")
              }
              className="mt-2 h-10 w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/35"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </aside>
      </div>
    </div>
  );
}
