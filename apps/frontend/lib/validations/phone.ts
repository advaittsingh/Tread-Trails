import { z } from "zod";

const IN_MOBILE = /^[6-9]\d{9}$/;

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/** Strip common international access prefix (e.g. 00 from Europe). */
function stripDoubleZeroPrefix(d: string): string {
  let out = d;
  while (out.startsWith("00") && out.length > 2) {
    out = out.slice(2);
  }
  return out;
}

export type PhoneValidation =
  | { ok: true; normalized: string }
  | { ok: false; message: string };

/**
 * Validates and normalizes phone input for India-first flows while allowing
 * international numbers (E.164 digit lengths without the leading +).
 */
export function validatePhone(raw: string): PhoneValidation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Phone number is required." };
  }

  let d = stripDoubleZeroPrefix(digitsOnly(trimmed));
  if (d.length === 0) {
    return {
      ok: false,
      message:
        "Use digits for your phone number — spaces, dashes, and parentheses are fine.",
    };
  }
  if (d.length > 15) {
    return {
      ok: false,
      message: "That phone number has too many digits (maximum 15 with country code).",
    };
  }

  if (d.length === 11 && d.startsWith("0")) {
    d = d.slice(1);
  }

  if (d.startsWith("91")) {
    if (d.length === 12) {
      const national = d.slice(2);
      if (IN_MOBILE.test(national)) {
        return { ok: true, normalized: national };
      }
      return {
        ok: false,
        message:
          "After +91, enter a valid 10-digit Indian mobile number (starting with 6–9).",
      };
    }
    if (d.length > 12) {
      return {
        ok: false,
        message:
          "That Indian number looks too long — check for duplicate country codes or extra digits.",
      };
    }
    if (d.length > 2) {
      return {
        ok: false,
        message:
          "Incomplete Indian number — include the full 10-digit mobile after +91.",
      };
    }
  }

  if (d.length === 10 && IN_MOBILE.test(d)) {
    return { ok: true, normalized: d };
  }

  if (d.length >= 8 && d.length <= 15) {
    return { ok: true, normalized: d };
  }

  if (d.length < 8) {
    return {
      ok: false,
      message:
        "Phone number is too short — use at least 8 digits, including country code if needed.",
    };
  }

  return { ok: false, message: "Enter a valid phone number." };
}

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .max(28, "Phone number is too long — shorten or remove extra symbols.")
  .superRefine((val, ctx) => {
    const r = validatePhone(val);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: r.message });
    }
  })
  .transform((val): string => {
    const r = validatePhone(val);
    if (!r.ok) throw new Error("phoneSchema: invalid after refine");
    return r.normalized;
  });
