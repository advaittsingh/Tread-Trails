"use client";

import { useCallback, useRef, useState } from "react";

import {
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/validations/contact";
import { validatePhone } from "@/lib/validations/phone";
import { whatsappHref } from "@/lib/whatsapp";

import { WhatsAppCta } from "@/components/marketing/cta-buttons";
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

type FieldKey = keyof ContactFormValues;

const emptyValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

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

export function ContactForm() {
  const submitLock = useRef(false);
  const [values, setValues] = useState<ContactFormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = useCallback((key: FieldKey, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
    setServerError(null);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || submitting) return;
    setServerError(null);

    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(flattenFieldErrors(parsed.error.flatten()));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
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
        setServerError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
      setValues(emptyValues);
      setFieldErrors({});
    } catch {
      setServerError("Network error — check your connection and try again.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  const waMessage =
    `Hi — I'd like to speak with Tread Trails about: ${values.subject.trim() || "a general inquiry"}`.trim();

  if (success) {
    return (
      <Card className="border-border/70 shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle as="h2" className="font-heading text-2xl tracking-tight">
            Message sent
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Thanks for reaching out. Our concierge team will reply by email as soon as
            possible — usually within one business day.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <WhatsAppCta
            message="Hi — I just submitted the contact form on treadtrails.com."
            label="Follow up on WhatsApp"
            className="h-11 px-5"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setSuccess(false)}
          >
            Send another message
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/70 shadow-card">
        <CardHeader className="space-y-1">
          <CardTitle as="h2" className="font-heading text-xl tracking-tight md:text-2xl">
            Send a message
          </CardTitle>
          <CardDescription>
            Share your goals — expedition upgrades, bay bookings, or fleet programs — and
            we&apos;ll route you to the right engineer.
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

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={
                    fieldErrors.name ? "contact-name-error" : undefined
                  }
                  disabled={submitting}
                />
                {fieldErrors.name ? (
                  <p id="contact-name-error" className="text-xs text-destructive">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "contact-email-error" : undefined
                  }
                  disabled={submitting}
                />
                {fieldErrors.email ? (
                  <p id="contact-email-error" className="text-xs text-destructive">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  onBlur={() => {
                    const r = validatePhone(values.phone);
                    if (r.ok) update("phone", r.normalized);
                  }}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={
                    fieldErrors.phone ? "contact-phone-error" : undefined
                  }
                  disabled={submitting}
                />
                {fieldErrors.phone ? (
                  <p id="contact-phone-error" className="text-xs text-destructive">
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  name="subject"
                  autoComplete="off"
                  value={values.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.subject)}
                  aria-describedby={
                    fieldErrors.subject ? "contact-subject-error" : undefined
                  }
                  disabled={submitting}
                  placeholder="e.g. Hilux suspension consultation"
                />
                {fieldErrors.subject ? (
                  <p id="contact-subject-error" className="text-xs text-destructive">
                    {fieldErrors.subject}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-message">Message</Label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  value={values.message}
                  onChange={(e) => update("message", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={
                    fieldErrors.message ? "contact-message-error" : undefined
                  }
                  disabled={submitting}
                  placeholder="Tell us about your vehicle, timeline, and how we can help."
                  className="flex min-h-[140px] w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {fieldErrors.message ? (
                  <p id="contact-message-error" className="text-xs text-destructive">
                    {fieldErrors.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Minimum 10 characters.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Button
                type="submit"
                className="w-full sm:w-auto sm:min-w-[160px]"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send message"}
              </Button>
              <a
                href={whatsappHref(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-3 text-sm font-medium text-[#0f5132] transition hover:bg-[#25D366]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
              >
                Prefer WhatsApp? Chat now
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-6 lg:pt-2">
        <Card className="border-[#25D366]/25 bg-[#25D366]/[0.06] shadow-card">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle as="h3" className="font-heading text-lg tracking-tight">
              WhatsApp concierge
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              For fast answers on SKUs, bay timing, or expedition programs — message us
              directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <WhatsAppCta
              message="Hi — I'd like to speak with Tread Trails."
              label="Open WhatsApp"
              className="h-11 w-full px-4 sm:w-auto"
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle as="h3" className="font-heading text-lg tracking-tight">
              Studio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Bengaluru · Mumbai · Dubai — by appointment.</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/90">
              Same routing applies whether you email or WhatsApp.
            </p>
          </CardContent>
        </Card>
      </aside>
    </>
  );
}
