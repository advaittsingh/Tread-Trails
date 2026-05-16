"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cars } from "@/data/cars";
import { getProductBySlug } from "@/data/index";
import { getBuildBySlug } from "@/lib/build";
import { cn } from "@/lib/utils";
import {
  BOOKING_VEHICLE_FLOW_STEP_TITLES,
  VEHICLE_PLATFORM_SELECT_PLACEHOLDER,
} from "@/lib/ui/vehicle-selection-pattern";

import { useSelectedVehicle } from "@/contexts/selected-vehicle-context";

import { Badge } from "@/components/ui/badge";
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

import {
  BOOKING_SOON_BUFFER_MINUTES,
  BOOKING_TIME_SLOTS,
  bookingSelectableMaxISO,
  bookingSlotErrorMessage,
  bookingStudioClockContextClient,
  formatBookingSlotLabel,
  isBookingSlotDisabled,
  studioCalendarTodayISO,
  validateBookingSlot,
} from "@/lib/booking/slots";
import { validatePhone } from "@/lib/validations/phone";

const SERVICES = [
  "Consultation & measurements",
  "Lift & suspension program",
  "Lighting & auxiliary stack",
  "Armor & recovery suite",
  "Full expedition conversion",
];

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border/60 pt-6 first:border-t-0 first:pt-0">
      <h3 className="font-heading text-sm tracking-[0.2em] text-primary uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-destructive" aria-hidden>
        {" "}
        *
      </span>
    </Label>
  );
}

function isBookingFormComplete(
  values: {
    carSlug: string;
    service: string;
    date: string;
    time: string;
    name: string;
    email: string;
    phone: string;
  },
  utcOffsetMinutes: number
) {
  const { carSlug, service, date, time, name, email, phone } = values;
  if (!carSlug || !service || !date || !time) return false;
  if (!name.trim() || !email.trim() || !phone.trim()) return false;
  return (
    validateBookingSlot(date, time, { utcOffsetMinutes }) === null
  );
}

export function BookingForm() {
  const searchParams = useSearchParams();
  const { setSelectedSlug, slug: globalSlug, hydrated } = useSelectedVehicle();
  const didApplyStoredVehicle = useRef(false);
  const submitLock = useRef(false);
  const [carSlug, setCarSlug] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [
    vehicleSectionTitle,
    serviceSectionTitle,
    scheduleSectionTitle,
    contactSectionTitle,
  ] = BOOKING_VEHICLE_FLOW_STEP_TITLES;

  useEffect(() => {
    const vehicle = searchParams.get("vehicle");
    const productSlug = searchParams.get("product");
    const buildSlug = searchParams.get("build");
    const svc = searchParams.get("service");

    if (vehicle && cars.some((c) => c.slug === vehicle)) {
      setCarSlug(vehicle);
      setSelectedSlug(vehicle);
    }

    const parts: string[] = [];
    if (productSlug) {
      const p = getProductBySlug(productSlug);
      if (p) parts.push(`Product focus: ${p.name}`);
    }
    if (buildSlug) {
      const b = getBuildBySlug(buildSlug);
      if (b) parts.push(`Build reference: ${b.title}`);
    }
    if (svc) {
      setService(decodeURIComponent(svc));
      setPrefilled(true);
    } else if (parts.length) {
      const inferred =
        parts[0]?.startsWith("Build") === true
          ? "Full expedition conversion"
          : "Consultation & measurements";
      setService(inferred);
      setPrefilled(true);
    }
  }, [searchParams, setSelectedSlug]);

  useEffect(() => {
    if (!hydrated || didApplyStoredVehicle.current) return;
    didApplyStoredVehicle.current = true;
    const fromUrl = searchParams.get("vehicle");
    if (fromUrl && cars.some((c) => c.slug === fromUrl)) return;
    if (globalSlug) setCarSlug(globalSlug);
  }, [hydrated, globalSlug, searchParams]);

  const bookingClock = useMemo(() => bookingStudioClockContextClient(), []);

  const datePickerBounds = useMemo(() => {
    const now = new Date();
    const { utcOffsetMinutes } = bookingClock;
    return {
      min: studioCalendarTodayISO(now, utcOffsetMinutes),
      max: bookingSelectableMaxISO(now, utcOffsetMinutes),
    };
  }, [bookingClock]);

  const slotValidationIssue = useMemo(() => {
    if (!date || !time) return null;
    return validateBookingSlot(date, time, {
      utcOffsetMinutes: bookingClock.utcOffsetMinutes,
    });
  }, [date, time, bookingClock.utcOffsetMinutes]);

  const contextBadges = useMemo(() => {
    const productSlug = searchParams.get("product");
    const buildSlug = searchParams.get("build");
    const out: string[] = [];
    const p = productSlug ? getProductBySlug(productSlug) : undefined;
    const b = buildSlug ? getBuildBySlug(buildSlug) : undefined;
    if (p) out.push(p.name);
    if (b) out.push(b.title);
    return out;
  }, [searchParams]);

  useEffect(() => {
    if (!date || !time) return;
    if (
      validateBookingSlot(date, time, {
        utcOffsetMinutes: bookingClock.utcOffsetMinutes,
      }) !== null
    ) {
      setTime("");
    }
  }, [date, time, bookingClock.utcOffsetMinutes]);

  const formComplete = useMemo(
    () =>
      isBookingFormComplete(
        { carSlug, service, date, time, name, email, phone },
        bookingClock.utcOffsetMinutes
      ),
    [
      carSlug,
      service,
      date,
      time,
      name,
      email,
      phone,
      bookingClock.utcOffsetMinutes,
    ]
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current || submitting) return;

    const form = e.currentTarget;
    if (!form.reportValidity()) {
      setSubmitError("Complete all required fields before submitting.");
      return;
    }

    if (
      !isBookingFormComplete(
        { carSlug, service, date, time, name, email, phone },
        bookingClock.utcOffsetMinutes
      )
    ) {
      if (!time) {
        setSubmitError("Choose a time window.");
        document.getElementById("time-slots-label")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
      const slotIssue = validateBookingSlot(date, time, {
        utcOffsetMinutes: bookingClock.utcOffsetMinutes,
      });
      if (slotIssue) {
        setSubmitError(bookingSlotErrorMessage(slotIssue));
        return;
      }
      setSubmitError("Complete all required fields before submitting.");
      return;
    }

    setSubmitError(null);
    const vehicleName = cars.find((c) => c.slug === carSlug)?.name ?? "";
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!vehicleName || !trimmedName || !trimmedEmail) {
      setSubmitError("Complete all required fields before submitting.");
      return;
    }
    const slotIssue = validateBookingSlot(date, time, {
      utcOffsetMinutes: bookingClock.utcOffsetMinutes,
    });
    if (slotIssue) {
      setSubmitError(bookingSlotErrorMessage(slotIssue));
      return;
    }
    const phoneResult = validatePhone(phone);
    if (!phoneResult.ok) {
      setSubmitError(phoneResult.message);
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleSlug: carSlug,
          vehicleName,
          service,
          date,
          time,
          contactName: trimmedName,
          contactEmail: trimmedEmail,
          contactPhone: phoneResult.normalized,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSubmitError(data.error ?? "Could not save booking");
        return;
      }
      setDone(true);
    } catch {
      setSubmitError("Network error — try again.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle as="h2" className="font-heading text-2xl tracking-tight">
            Request received
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Thank you, {name || "driver"}. Your bay request is saved — our crew
            will confirm timing via {email}.
          </p>
          <p>
            <span className="font-medium text-foreground">{service}</span> for{" "}
            <span className="font-medium text-foreground">
              {cars.find((c) => c.slug === carSlug)?.name ?? "your vehicle"}
            </span>{" "}
            on <span className="font-medium text-foreground">{date}</span> at{" "}
            <span className="font-medium text-foreground">{time}</span>.
          </p>
          <Link
            href="/account"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex w-full justify-center"
            )}
          >
            View account
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl border-border/70 shadow-card">
      <CardHeader className="gap-4">
        <CardTitle as="h2" className="font-heading text-2xl tracking-tight">
          Book installation
        </CardTitle>
        {(prefilled || contextBadges.length > 0) && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
            <span className="w-full text-[11px] font-medium tracking-widest text-primary uppercase">
              Prefilled context
            </span>
            {contextBadges.map((label) => (
              <Badge key={label} variant="secondary" className="rounded-full">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-0">
          {submitError ? (
            <p className="mb-6 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}

          <FormSection title={vehicleSectionTitle}>
            <div>
              <RequiredLabel htmlFor="car">Vehicle platform</RequiredLabel>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Required — pick the chassis we&apos;re scheduling for (same
                slugs as vehicle hub URLs).
                {searchParams.get("vehicle") ? (
                  <>
                    {" "}
                    <span className="text-foreground/90">
                      Pre-filled from the link you followed — change if needed.
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <select
              id="car"
              required
              disabled={submitting}
              value={carSlug}
              onChange={(e) => {
                const v = e.target.value;
                setCarSlug(v);
                setSelectedSlug(v || null);
              }}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{VEHICLE_PLATFORM_SELECT_PLACEHOLDER}</option>
              {cars.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormSection>

          <FormSection title={serviceSectionTitle}>
            <div className="space-y-3">
              <RequiredLabel htmlFor="service">Service focus</RequiredLabel>
              <select
                id="service"
                required
                disabled={submitting}
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select program…</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </FormSection>

          <FormSection title={scheduleSectionTitle}>
            <div className="space-y-5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Times use the studio clock (
                {bookingClock.timeZone.replace(/_/g, " ")}). Same-day visits
                need at least {BOOKING_SOON_BUFFER_MINUTES} minutes&apos;
                notice. Sundays are blocked — pick another day.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <RequiredLabel htmlFor="date">Preferred date</RequiredLabel>
                  <Input
                    id="date"
                    type="date"
                    required
                    disabled={submitting}
                    min={datePickerBounds.min}
                    max={datePickerBounds.max}
                    autoComplete="off"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-invalid={Boolean(date && slotValidationIssue)}
                    className="font-medium tabular-nums"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Choose between {datePickerBounds.min} and{" "}
                    {datePickerBounds.max}.
                  </p>
                </div>
                <div className="space-y-3">
                  <RequiredLabel htmlFor="booking-time">
                    <span id="time-slots-label">Time window</span>
                  </RequiredLabel>
                  <input
                    id="booking-time"
                    type="text"
                    tabIndex={-1}
                    required
                    value={time}
                    readOnly
                    aria-hidden
                    className="sr-only"
                    onChange={() => undefined}
                  />
                  <div
                    role="radiogroup"
                    aria-labelledby="time-slots-label"
                    aria-required
                    className="grid grid-cols-2 gap-2"
                  >
                    {BOOKING_TIME_SLOTS.map((slot) => {
                      const disabled =
                        !date ||
                        isBookingSlotDisabled(date, slot, {
                          utcOffsetMinutes: bookingClock.utcOffsetMinutes,
                        });
                      const selected = time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={disabled || submitting}
                          onClick={() =>
                            !disabled && !submitting && setTime(slot)
                          }
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45",
                            selected
                              ? "border-primary bg-primary/10 font-medium text-foreground"
                              : "border-input bg-background hover:border-primary/40 hover:bg-muted/40"
                          )}
                        >
                          <span className="tabular-nums">
                            {formatBookingSlotLabel(slot)}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                            {slot}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {slotValidationIssue && date && time ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {bookingSlotErrorMessage(slotValidationIssue)}
                </p>
              ) : null}
            </div>
          </FormSection>

          <FormSection title={contactSectionTitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 sm:col-span-2">
                <RequiredLabel htmlFor="name">Full name</RequiredLabel>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  disabled={submitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <RequiredLabel htmlFor="email">Email</RequiredLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={submitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <RequiredLabel htmlFor="phone">Phone</RequiredLabel>
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  disabled={submitting}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => {
                    const r = validatePhone(phone);
                    if (r.ok) setPhone(r.normalized);
                  }}
                />
              </div>
            </div>
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-border/60 bg-muted/20">
          <Button
            type="submit"
            disabled={submitting || !formComplete}
            className="min-w-[10rem]"
          >
            {submitting ? "Sending…" : "Submit request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
