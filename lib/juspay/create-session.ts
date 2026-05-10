import type { JuspaySessionResult } from "@/lib/juspay/types";

/**
 * Creates a hosted payment-page session (Hyper Checkout · action `paymentPage`).
 * Env: `JUSPAY_API_KEY`, `JUSPAY_MERCHANT_ID`, `JUSPAY_PAYMENT_PAGE_CLIENT_ID`
 *
 * `merchantOrderRef` must obey Juspay limits (alphanumeric, &lt; 21 chars).
 */
export async function createJuspayPaymentSession(input: {
  merchantOrderRef: string;
  amountInr: number;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  routingId: string;
  returnUrl: string;
}): Promise<JuspaySessionResult> {
  const apiKey = process.env.JUSPAY_API_KEY?.trim();
  const merchantId = process.env.JUSPAY_MERCHANT_ID?.trim();
  const clientId = process.env.JUSPAY_PAYMENT_PAGE_CLIENT_ID?.trim();

  if (!apiKey || !merchantId || !clientId) {
    return { ok: false, error: "Juspay is not configured." };
  }

  const [firstName, ...rest] = input.customerName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const amountStr =
    Number.isInteger(input.amountInr) && input.amountInr >= 1
      ? String(input.amountInr)
      : input.amountInr.toFixed(2);

  const payload = {
    order_id: input.merchantOrderRef,
    amount: amountStr,
    customer_id: input.routingId.slice(0, 64),
    customer_email: input.customerEmail,
    customer_phone:
      input.customerPhone.replace(/\D/g, "").slice(-15) || "9999999999",
    payment_page_client_id: clientId,
    action: "paymentPage",
    return_url: input.returnUrl,
    description: "Tread Trails order",
    first_name: firstName.slice(0, 64),
    last_name: lastName.slice(0, 64),
  };

  const auth =
    "Basic " + Buffer.from(`${apiKey}:`, "utf8").toString("base64");

  try {
    const res = await fetch("https://api.juspay.in/session", {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        "x-merchantid": merchantId,
        "x-routing-id": input.routingId.slice(0, 64),
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        error: `Juspay returned non-JSON (${res.status}).`,
      };
    }

    if (!res.ok) {
      const msg =
        typeof json === "object" && json && "error_message" in json
          ? String((json as { error_message?: string }).error_message)
          : raw.slice(0, 200);
      return { ok: false, error: msg || `Juspay error (${res.status})` };
    }

    const obj = json as {
      id?: string;
      payment_links?: { web?: string };
      order_id?: string;
    };

    const web = obj.payment_links?.web;
    const gatewayOrderId = obj.id ?? "";
    if (!web || !gatewayOrderId) {
      return { ok: false, error: "Juspay session missing payment link." };
    }

    return {
      ok: true,
      gatewayOrderId,
      merchantOrderRef: obj.order_id ?? input.merchantOrderRef,
      paymentLinkWeb: web,
    };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not reach Juspay." };
  }
}
