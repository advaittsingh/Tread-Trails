"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

import {
  forgotPasswordRequestSchema,
  type ForgotPasswordRequestValues,
} from "@/lib/validations/forgot-password";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldKey = keyof ForgotPasswordRequestValues;

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

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateEmail = useCallback((value: string) => {
    setEmail(value);
    setFieldErrors((e) => ({ ...e, email: undefined }));
    setServerError(null);
    setSuccessMessage(null);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const parsed = forgotPasswordRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(flattenFieldErrors(parsed.error.flatten()));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        details?: { fieldErrors?: Partial<Record<FieldKey, string[]>> };
      };

      if (!res.ok) {
        if (res.status === 400 && data.details?.fieldErrors) {
          setFieldErrors(flattenFieldErrors(data.details));
        }
        setServerError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccessMessage(
        data.message ??
          "If an account exists for that email, we sent reset instructions."
      );
      setEmail("");
      setFieldErrors({});
    } catch {
      setServerError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="space-y-6">
        <p
          role="status"
          className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-sm leading-relaxed text-foreground"
        >
          {successMessage}
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants(), "inline-flex w-full justify-center")}
        >
          Back to login
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

      <div className="space-y-3">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => updateEmail(e.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "forgot-email-error" : undefined}
          disabled={loading}
          placeholder="you@company.com"
        />
        {fieldErrors.email ? (
          <p id="forgot-email-error" className="text-xs text-destructive">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
