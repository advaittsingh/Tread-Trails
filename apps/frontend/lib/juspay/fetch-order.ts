/**
 * Fetch merchant order from Juspay (status sync after redirect).
 */
export async function fetchJuspayOrderStatus(merchantOrderRef: string): Promise<{
  ok: boolean;
  status?: string;
  error?: string;
}> {
  const apiKey = process.env.JUSPAY_API_KEY?.trim();
  const merchantId = process.env.JUSPAY_MERCHANT_ID?.trim();
  if (!apiKey || !merchantId) {
    return { ok: false, error: "Juspay not configured" };
  }

  const auth =
    "Basic " + Buffer.from(`${apiKey}:`, "utf8").toString("base64");

  try {
    const res = await fetch(
      `https://api.juspay.in/orders/${encodeURIComponent(merchantOrderRef)}`,
      {
        headers: {
          Authorization: auth,
          "x-merchantid": merchantId,
          "Content-Type": "application/json",
        },
      }
    );
    const raw = await res.text();
    let parsed: { status?: string };
    try {
      parsed = JSON.parse(raw) as { status?: string };
    } catch {
      return { ok: false, error: "Invalid Juspay response" };
    }
    if (!res.ok) {
      return { ok: false, error: raw.slice(0, 160) };
    }
    return { ok: true, status: parsed.status };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Juspay request failed" };
  }
}
