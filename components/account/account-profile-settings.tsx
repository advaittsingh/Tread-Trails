"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useVehicleCatalog } from "@/hooks/use-vehicle-catalog";
import { useAuth } from "@/contexts/auth-context";
import { accountProfileUpdateSchema } from "@/lib/validations/profile";
import { validatePhone } from "@/lib/validations/phone";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type FieldKey = "name" | "email" | "phone" | "preferredVehicleSlug";

function flattenFieldErrors(
  details?: { fieldErrors?: Partial<Record<FieldKey, string[] | undefined>> }
): Partial<Record<FieldKey, string>> {
  if (!details?.fieldErrors) return {};
  const out: Partial<Record<FieldKey, string>> = {};
  for (const key of Object.keys(details.fieldErrors) as FieldKey[]) {
    const msg = details.fieldErrors[key]?.[0];
    if (msg) out[key] = msg;
  }
  return out;
}

export function AccountProfileSettings() {
  const submitLock = useRef(false);
  const { vehicles: cars } = useVehicleCatalog();
  const { user, loading, refresh } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleSlug, setVehicleSlug] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setVehicleSlug(user.preferredVehicleSlug ?? "");
  }, [user]);

  const clearFieldError = useCallback((key: FieldKey) => {
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
    setServerError(null);
    setSuccess(false);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || submitting || !user) return;
    setServerError(null);
    setSuccess(false);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() === "" ? ("" as const) : phone.trim(),
      preferredVehicleSlug:
        vehicleSlug.trim() === "" ? null : vehicleSlug.trim(),
    };

    const parsed = accountProfileUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(flattenFieldErrors(parsed.error.flatten()));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as {
        error?: string;
        details?: { fieldErrors?: Partial<Record<FieldKey, string[]>> };
      };

      if (!res.ok) {
        if (res.status === 400 && data.details?.fieldErrors) {
          setFieldErrors(flattenFieldErrors(data.details));
        }
        setServerError(data.error ?? "Could not save profile.");
        return;
      }

      setSuccess(true);
      setFieldErrors({});
      await refresh();
    } catch {
      setServerError("Network error — try again.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <Card className="border-border/70 shadow-card">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-card">
      <CardHeader className="space-y-1">
        <CardTitle as="h2" className="font-heading text-xl tracking-tight">
          Profile
        </CardTitle>
        <CardDescription>
          Name, email, phone, and default chassis — used for bookings, checkout,
          and catalogue defaults when you&apos;re signed in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          {serverError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </p>
          ) : null}
          {success ? (
            <p
              role="status"
              className="rounded-xl border border-primary/30 bg-primary/8 px-4 py-3 text-sm text-foreground"
            >
              Profile saved.
            </p>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={
                  fieldErrors.name ? "profile-name-error" : undefined
                }
                disabled={submitting}
              />
              {fieldErrors.name ? (
                <p id="profile-name-error" className="text-xs text-destructive">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={
                  fieldErrors.email ? "profile-email-error" : undefined
                }
                disabled={submitting}
              />
              {fieldErrors.email ? (
                <p id="profile-email-error" className="text-xs text-destructive">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError("phone");
                }}
                onBlur={() => {
                  if (!phone.trim()) return;
                  const r = validatePhone(phone);
                  if (r.ok) setPhone(r.normalized);
                }}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={
                  fieldErrors.phone ? "profile-phone-error" : undefined
                }
                disabled={submitting}
                placeholder="Optional — Indian mobile or international"
              />
              {fieldErrors.phone ? (
                <p id="profile-phone-error" className="text-xs text-destructive">
                  {fieldErrors.phone}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to clear. Same rules as checkout and contact forms.
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-vehicle">Preferred vehicle</Label>
              <select
                id="profile-vehicle"
                name="preferredVehicleSlug"
                value={vehicleSlug}
                onChange={(e) => {
                  setVehicleSlug(e.target.value);
                  clearFieldError("preferredVehicleSlug");
                }}
                aria-invalid={Boolean(fieldErrors.preferredVehicleSlug)}
                aria-describedby={
                  fieldErrors.preferredVehicleSlug
                    ? "profile-vehicle-error"
                    : undefined
                }
                disabled={submitting}
                className="flex h-11 w-full max-w-md rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">No default — pick per session</option>
                {cars.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.preferredVehicleSlug ? (
                <p
                  id="profile-vehicle-error"
                  className="text-xs text-destructive"
                >
                  {fieldErrors.preferredVehicleSlug}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Syncs with the chassis selector across the site when you&apos;re logged in.
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
