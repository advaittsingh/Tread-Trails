"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { resetPasswordSchema } from "@/lib/validations/forgot-password";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams]
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errors: { password?: string; confirm?: string } = {};

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      if (flat.password?.[0]) errors.password = flat.password[0];
      if (flat.token?.[0]) setServerError(flat.token[0]);
      setFieldErrors(errors);
      return;
    }

    if (password !== confirm) {
      errors.confirm = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setServerError(data.error ?? "Could not reset password.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          This page needs a valid reset link from your email. Request a new link below.
        </p>
        <Link
          href="/forgot-password"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "inline-flex w-full justify-center"
          )}
        >
          Forgot password
        </Link>
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <p
          role="status"
          className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm leading-relaxed text-foreground"
        >
          Your password has been updated. Sign in with your new password.
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants(), "inline-flex w-full justify-center")}
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {serverError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <input type="hidden" name="token" value={token} readOnly aria-hidden />

      <div className="space-y-3">
        <Label htmlFor="reset-password">New password</Label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((f) => ({ ...f, password: undefined }));
          }}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "reset-password-error" : undefined
          }
          disabled={loading}
          minLength={8}
        />
        {fieldErrors.password ? (
          <p id="reset-password-error" className="text-xs text-destructive">
            {fieldErrors.password}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="reset-password-confirm">Confirm password</Label>
        <Input
          id="reset-password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setFieldErrors((f) => ({ ...f, confirm: undefined }));
          }}
          aria-invalid={Boolean(fieldErrors.confirm)}
          aria-describedby={
            fieldErrors.confirm ? "reset-password-confirm-error" : undefined
          }
          disabled={loading}
          minLength={8}
        />
        {fieldErrors.confirm ? (
          <p id="reset-password-confirm-error" className="text-xs text-destructive">
            {fieldErrors.confirm}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
