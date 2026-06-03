"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { accountChangePasswordSchema } from "@/lib/validations/profile";

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

type FieldKey = "currentPassword" | "newPassword" | "confirmPassword";

function flattenFieldErrors(
  details?: {
    fieldErrors?: Partial<Record<FieldKey, string[] | undefined>>;
  }
): Partial<Record<FieldKey, string>> {
  if (!details?.fieldErrors) return {};
  const out: Partial<Record<FieldKey, string>> = {};
  for (const key of Object.keys(details.fieldErrors) as FieldKey[]) {
    const msg = details.fieldErrors[key]?.[0];
    if (msg) out[key] = msg;
  }
  return out;
}

export function AccountChangePassword() {
  const submitLock = useRef(false);
  const { user, loading } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    const parsed = accountChangePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setFieldErrors(flattenFieldErrors(parsed.error.flatten()));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
          confirmPassword: parsed.data.confirmPassword,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        details?: { fieldErrors?: Partial<Record<FieldKey, string[]>> };
      };

      if (!res.ok) {
        if (res.status === 400 && data.details?.fieldErrors) {
          setFieldErrors(flattenFieldErrors(data.details));
        }
        setServerError(data.error ?? "Could not update password.");
        return;
      }

      setSuccess(true);
      setFieldErrors({});
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 max-w-lg" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 max-w-md" />
          <Skeleton className="h-10 max-w-md" />
          <Skeleton className="h-10 max-w-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-card">
      <CardHeader className="space-y-1">
        <CardTitle as="h2" className="font-heading text-xl tracking-tight">
          Change password
        </CardTitle>
        <CardDescription>
          Use a strong password you don&apos;t reuse elsewhere. Forgot it? Use{" "}
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline"
          >
            reset via email
          </Link>
          .
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
              Password updated. Use your new password next time you sign in on another device.
            </p>
          ) : null}

          <div className="grid max-w-md gap-6">
            <div className="space-y-2">
              <Label htmlFor="pwd-current">Current password</Label>
              <Input
                id="pwd-current"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearFieldError("currentPassword");
                }}
                aria-invalid={Boolean(fieldErrors.currentPassword)}
                aria-describedby={
                  fieldErrors.currentPassword ? "pwd-current-error" : undefined
                }
                disabled={submitting}
              />
              {fieldErrors.currentPassword ? (
                <p id="pwd-current-error" className="text-xs text-destructive">
                  {fieldErrors.currentPassword}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwd-new">New password</Label>
              <Input
                id="pwd-new"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearFieldError("newPassword");
                }}
                aria-invalid={Boolean(fieldErrors.newPassword)}
                aria-describedby={
                  fieldErrors.newPassword ? "pwd-new-error" : undefined
                }
                disabled={submitting}
              />
              {fieldErrors.newPassword ? (
                <p id="pwd-new-error" className="text-xs text-destructive">
                  {fieldErrors.newPassword}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  At least 8 characters.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwd-confirm">Confirm new password</Label>
              <Input
                id="pwd-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword ? "pwd-confirm-error" : undefined
                }
                disabled={submitting}
              />
              {fieldErrors.confirmPassword ? (
                <p id="pwd-confirm-error" className="text-xs text-destructive">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>

          <Button type="submit" variant="secondary" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
