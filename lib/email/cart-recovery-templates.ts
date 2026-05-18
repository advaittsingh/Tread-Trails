import { formatInr } from "@/lib/format";

export type CartRecoveryTemplateId = "complete_order" | "cart_waiting";

export type CartRecoveryLine = {
  name: string;
  productSlug: string;
  quantity: number;
  unitPrice?: number | null;
  image?: string;
  variantLabel?: string;
};

export type CartRecoveryTemplateContext = {
  firstName?: string;
  lines: CartRecoveryLine[];
  subtotalHint: number;
  checkoutUrl: string;
};

function lineRowsHtml(lines: CartRecoveryLine[]): string {
  if (lines.length === 0) {
    return `<p style="color:#6b7280;font-size:14px;">Your saved items are waiting in checkout.</p>`;
  }
  return lines
    .map((line) => {
      const price =
        line.unitPrice != null ? formatInr(line.unitPrice * line.quantity) : null;
      const img = line.image
        ? `<img src="${line.image}" alt="" width="56" height="56" style="border-radius:8px;object-fit:cover;margin-right:12px;" />`
        : "";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;vertical-align:middle;">
            <div style="display:flex;align-items:center;">
              ${img}
              <div>
                <strong style="color:#111827;font-size:14px;">${escapeHtml(line.name)}</strong>
                ${line.variantLabel ? `<div style="color:#6b7280;font-size:12px;">${escapeHtml(line.variantLabel)}</div>` : ""}
              </div>
            </div>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;">${line.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;font-weight:600;">${price ?? "—"}</td>
        </tr>`;
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(subject: string, body: string): { subject: string; html: string } {
  return {
    subject,
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <tr>
      <td style="background:#0f172a;padding:24px 28px;">
        <p style="margin:0;color:#8f3a2c;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Tread Trails</p>
        <h1 style="margin:8px 0 0;color:#f9fafb;font-size:22px;font-weight:600;">${escapeHtml(subject)}</h1>
      </td>
    </tr>
    <tr><td style="padding:28px;">${body}</td></tr>
    <tr>
      <td style="padding:16px 28px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
        Expedition-grade upgrades · Bengaluru · Mumbai · Dubai
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

export function buildCartRecoveryEmail(
  template: CartRecoveryTemplateId,
  ctx: CartRecoveryTemplateContext
): { subject: string; html: string } {
  const name = ctx.firstName?.trim() || "there";
  const total = formatInr(ctx.subtotalHint) ?? "your cart total";
  const table = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">
      <thead>
        <tr style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">
          <th align="left" style="padding-bottom:8px;">Item</th>
          <th align="center" style="padding-bottom:8px;">Qty</th>
          <th align="right" style="padding-bottom:8px;">Line</th>
        </tr>
      </thead>
      <tbody>${lineRowsHtml(ctx.lines)}</tbody>
    </table>`;

  const cta = `<p style="margin:24px 0 0;">
    <a href="${ctx.checkoutUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
      Complete checkout
    </a>
  </p>`;

  if (template === "cart_waiting") {
    return layout(
      "Your cart is waiting",
      `<p style="color:#374151;line-height:1.6;">Hi ${escapeHtml(name)},</p>
       <p style="color:#374151;line-height:1.6;">You left expedition gear in your cart — we have held your line items. Subtotal about <strong>${total}</strong>.</p>
       ${table}
       <p style="color:#6b7280;font-size:13px;line-height:1.5;">Need help with fitment? Reply to this email or message us on WhatsApp.</p>
       ${cta}`
    );
  }

  return layout(
    "Complete your order",
    `<p style="color:#374151;line-height:1.6;">Hi ${escapeHtml(name)},</p>
     <p style="color:#374151;line-height:1.6;">Your build sheet is saved and ready — finish checkout to lock in pricing (about <strong>${total}</strong>).</p>
     ${table}
     <p style="color:#6b7280;font-size:13px;line-height:1.5;">Stripe, Razorpay, Juspay, and COD available at checkout.</p>
     ${cta}`
  );
}

export function whatsappRecoveryMessage(
  template: CartRecoveryTemplateId,
  ctx: CartRecoveryTemplateContext
): string {
  const name = ctx.firstName?.trim() || "there";
  const total = formatInr(ctx.subtotalHint);
  const itemSummary =
    ctx.lines.length > 0
      ? ctx.lines
          .slice(0, 3)
          .map((l) => `${l.name} ×${l.quantity}`)
          .join(", ")
      : "your saved items";
  const more = ctx.lines.length > 3 ? ` (+${ctx.lines.length - 3} more)` : "";

  if (template === "cart_waiting") {
    return `Hi ${name} — your Tread Trails cart is still waiting (${itemSummary}${more}${total ? `, ~${total}` : ""}). Complete checkout when ready: ${ctx.checkoutUrl}`;
  }
  return `Hi ${name} — ready to complete your Tread Trails order? (${itemSummary}${more}${total ? `, ~${total}` : ""}) ${ctx.checkoutUrl}`;
}
