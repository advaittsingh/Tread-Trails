"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { toastError, toastSuccess } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TEMPLATES = [
  "complete_order",
  "cart_waiting",
  "interest",
  "booking_confirmed",
  "order_shipped",
] as const;

type TemplateId = (typeof TEMPLATES)[number];

const TEMPLATE_LABELS: Record<TemplateId, string> = {
  complete_order: "Complete your order",
  cart_waiting: "Your cart is waiting",
  interest: "We noticed your interest",
  booking_confirmed: "Booking confirmed",
  order_shipped: "Order shipped",
};

export function AdminCrmPanel() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [template, setTemplate] = useState<TemplateId>("complete_order");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const prefill = searchParams.get("email")?.trim();
    const prefillTemplate = searchParams.get("template")?.trim();
    if (prefill) setEmail(prefill);
    if (
      prefillTemplate &&
      TEMPLATES.includes(prefillTemplate as TemplateId)
    ) {
      setTemplate(prefillTemplate as TemplateId);
    }
  }, [searchParams]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          template,
          firstName: firstName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setMessage(`Queued · provider id ${data.id ?? "n/a"}`);
      toastSuccess("Email queued", data.id ? String(data.id) : undefined);
      setEmail("");
      setFirstName("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setMessage(msg);
      toastError("Send failed", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6 lg:p-10">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="font-heading text-2xl tracking-tight text-white md:text-3xl">
          CRM · transactional send
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Pre-fill from abandoned carts via query{" "}
          <code className="text-emerald-300">?email=</code>. Requires Resend env vars.
        </p>
      </header>

      <form
        onSubmit={send}
        className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="crm-email" className="text-zinc-300">
            Recipient email
          </Label>
          <Input
            id="crm-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-zinc-700 bg-zinc-950 text-zinc-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="crm-name" className="text-zinc-300">
            First name (optional)
          </Label>
          <Input
            id="crm-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-zinc-700 bg-zinc-950 text-zinc-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="crm-template" className="text-zinc-300">
            Template
          </Label>
          <select
            id="crm-template"
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateId)}
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {TEMPLATE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {message ? (
          <p className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
            {message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
        >
          {loading ? "Sending…" : "Send email"}
        </Button>
      </form>
    </div>
  );
}
