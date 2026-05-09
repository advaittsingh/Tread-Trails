"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cars } from "@/data/cars";
import { getBuildBySlug, getProductBySlug } from "@/data/index";
import { cn } from "@/lib/utils";

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
import { Progress } from "@/components/ui/progress";

const SERVICES = [
  "Consultation & measurements",
  "Lift & suspension program",
  "Lighting & auxiliary stack",
  "Armor & recovery suite",
  "Full expedition conversion",
];

const TIME_SLOTS = ["09:30", "11:00", "13:30", "15:30", "17:00"];

export function BookingForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
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

  useEffect(() => {
    const vehicle = searchParams.get("vehicle");
    const productSlug = searchParams.get("product");
    const buildSlug = searchParams.get("build");
    const svc = searchParams.get("service");

    if (vehicle) setCarSlug(vehicle);

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
  }, [searchParams]);

  const progress = useMemo(() => ((step + 1) / 4) * 100, [step]);

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

  function next() {
    setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const vehicleName = cars.find((c) => c.slug === carSlug)?.name ?? "";
    if (!vehicleName) {
      setSubmitError("Select a vehicle.");
      return;
    }
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
          contactName: name,
          contactEmail: email,
          contactPhone: phone,
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
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-lg border-border/70 shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-2xl tracking-tight">
            Request received
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Thank you, {name || "driver"}. Your bay request is saved — our crew will confirm timing via{" "}
            {email}.
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
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center")}
          >
            View account
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl border-border/70 shadow-card">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="font-heading text-2xl tracking-tight">
            Book installation
          </CardTitle>
          <span className="text-xs tracking-widest text-muted-foreground uppercase">
            Step {step + 1} / 4
          </span>
        </div>
        <Progress value={progress} />
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
      <form onSubmit={step === 3 ? submit : (e) => e.preventDefault()}>
        <CardContent className="space-y-6">
          {submitError ? (
            <p className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
          {step === 0 ? (
            <div className="space-y-3">
              <Label htmlFor="car">Select vehicle</Label>
              <select
                id="car"
                required
                value={carSlug}
                onChange={(e) => setCarSlug(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choose platform…</option>
                {cars.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <Label htmlFor="service">Service focus</Label>
              <select
                id="service"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select program…</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="date">Preferred date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="time">Time window</Label>
                <select
                  id="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select…</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
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
                (step === 0 && !carSlug) ||
                (step === 1 && !service) ||
                (step === 2 && (!date || !time))
              }
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Submit request"}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
