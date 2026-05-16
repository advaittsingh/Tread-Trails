"use client";

import { useCallback, useRef, useState } from "react";

import {
  corporateBusinessTypes,
  corporateInquirySchema,
  type CorporateInquiryValues,
} from "@/lib/validations/corporate-inquiry";
import { withPlainAmpersand } from "@/lib/plain-ampersand";
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

type FormValues = {
  [K in keyof CorporateInquiryValues]: string;
};

type FieldKey = keyof FormValues;

const emptyValues: FormValues = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  businessType: "",
  requirements: "",
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

export function CorporateInquiryForm() {
  const submitLock = useRef(false);
  const [values, setValues] = useState<FormValues>(emptyValues);
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

    const parsed = corporateInquirySchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(flattenFieldErrors(parsed.error.flatten()));
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/corporate-inquiry", {
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

  const waCompany = values.companyName.trim();
  const waMessage =
    `Hi — I'm submitting a corporate inquiry${waCompany ? ` (${waCompany})` : ""} regarding expedition upgrades / fleet programs.`;

  if (success) {
    return (
      <Card className="border-border/70 shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle as="h2" className="font-heading text-2xl tracking-tight">
            Inquiry received
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Thank you — our partnerships desk will review your requirements and reply by email,
            typically within two business days. Larger procurement threads may include a short
            discovery call.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <WhatsAppCta
            message="Hi — I just submitted a corporate inquiry on treadtrails.com."
            label="Follow up on WhatsApp"
            className="h-11 px-5"
          />
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setSuccess(false)}
          >
            Submit another inquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/70 shadow-card">
        <CardHeader className="space-y-1">
          <CardTitle className="font-heading text-xl tracking-tight md:text-2xl">
            {withPlainAmpersand("Corporate & fleet inquiries")}
          </CardTitle>
          <CardDescription>
            Brief our team on volumes, timelines, and platform mix — we&apos;ll route you to the
            right programme owner (fleet installs, reseller pathways, or bespoke procurement).
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
                <Label htmlFor="corp-company">Company name</Label>
                <Input
                  id="corp-company"
                  name="organization"
                  autoComplete="organization"
                  value={values.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.companyName)}
                  aria-describedby={
                    fieldErrors.companyName ? "corp-company-error" : undefined
                  }
                  disabled={submitting}
                  placeholder="Registered entity or fleet operator name"
                />
                {fieldErrors.companyName ? (
                  <p id="corp-company-error" className="text-xs text-destructive">
                    {fieldErrors.companyName}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="corp-contact">Contact person</Label>
                <Input
                  id="corp-contact"
                  name="name"
                  autoComplete="name"
                  value={values.contactPerson}
                  onChange={(e) => update("contactPerson", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.contactPerson)}
                  aria-describedby={
                    fieldErrors.contactPerson ? "corp-contact-error" : undefined
                  }
                  disabled={submitting}
                />
                {fieldErrors.contactPerson ? (
                  <p id="corp-contact-error" className="text-xs text-destructive">
                    {fieldErrors.contactPerson}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="corp-email">Email</Label>
                <Input
                  id="corp-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "corp-email-error" : undefined
                  }
                  disabled={submitting}
                />
                {fieldErrors.email ? (
                  <p id="corp-email-error" className="text-xs text-destructive">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="corp-phone">Phone</Label>
                <Input
                  id="corp-phone"
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
                    fieldErrors.phone ? "corp-phone-error" : undefined
                  }
                  disabled={submitting}
                />
                {fieldErrors.phone ? (
                  <p id="corp-phone-error" className="text-xs text-destructive">
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="corp-business-type">Business type</Label>
                <select
                  id="corp-business-type"
                  name="businessType"
                  value={values.businessType}
                  onChange={(e) => update("businessType", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.businessType)}
                  aria-describedby={
                    fieldErrors.businessType ? "corp-business-type-error" : undefined
                  }
                  disabled={submitting}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select business type…</option>
                  {corporateBusinessTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {fieldErrors.businessType ? (
                  <p
                    id="corp-business-type-error"
                    className="text-xs text-destructive"
                  >
                    {fieldErrors.businessType}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="corp-requirements">Requirements</Label>
                <textarea
                  id="corp-requirements"
                  name="requirements"
                  rows={8}
                  value={values.requirements}
                  onChange={(e) => update("requirements", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.requirements)}
                  aria-describedby={
                    fieldErrors.requirements ? "corp-requirements-error" : undefined
                  }
                  disabled={submitting}
                  placeholder="Volumes (units/year), regions, vehicle platforms, timeline, integration expectations (invoicing, SLAs), and any compliance constraints."
                  className="flex min-h-[180px] w-full resize-y rounded-xl border border-input bg-background px-3 py-3 text-sm shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {fieldErrors.requirements ? (
                  <p id="corp-requirements-error" className="text-xs text-destructive">
                    {fieldErrors.requirements}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Minimum 30 characters — specificity helps us respond faster.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Button
                type="submit"
                className="w-full sm:w-auto sm:min-w-[180px]"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Submit inquiry"}
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
        <Card className="border-primary/20 bg-primary/[0.04] shadow-card">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle as="h3" className="font-heading text-lg tracking-tight">
              Engagement norms
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Fleet and reseller programmes typically begin with a short discovery phase —
              volumes, bay windows, and catalogue boundaries — before formal quoting.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            <p className="leading-relaxed">
              Prefer email-only until NDAs are sorted — submit this form; inbound lands with reply-to set to your address.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle as="h3" className="font-heading text-lg tracking-tight">
              WhatsApp
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Fast escalation when procurement stakeholders already aligned internally.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <WhatsAppCta
              message="Hi — we have a corporate / fleet inquiry for Tread Trails."
              label="Message concierge"
              className="h-11 w-full px-4 sm:w-auto"
              variant="outline"
            />
          </CardContent>
        </Card>
      </aside>
    </>
  );
}
