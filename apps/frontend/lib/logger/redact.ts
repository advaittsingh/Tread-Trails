const SENSITIVE_KEYS =
  /^(password|passwordHash|token|authorization|cookie|secret|apiKey|api_key|creditCard|cardNumber|cvv|ssn|razorpay_signature|stripe-signature)$/i;

const PARTIAL_REDACT_KEYS = /^(email|phone|customerEmail|contactEmail|guestEmail)$/i;

export function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.test(key)) return "[REDACTED]";
  if (typeof value === "string" && PARTIAL_REDACT_KEYS.test(key)) {
    if (key.toLowerCase().includes("email") && value.includes("@")) {
      const [local, domain] = value.split("@");
      return `${local?.slice(0, 2) ?? ""}***@${domain ?? "redacted"}`;
    }
    if (value.length > 4) return `***${value.slice(-4)}`;
    return "***";
  }
  return value;
}

export function redactMeta(
  meta: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = redactMeta(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item && typeof item === "object"
          ? redactMeta(item as Record<string, unknown>)
          : item
      );
    } else {
      out[k] = redactValue(k, v);
    }
  }
  return out;
}
