export type LeadEmailTemplateId =
  | "interest"
  | "follow_up"
  | "qualified_next_steps"
  | "thank_you";

export type LeadEmailContext = {
  firstName: string;
  companyName?: string;
  subject?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;font-family:system-ui,sans-serif;background:#f3f4f6;">
<table width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
<tr><td style="background:#0f172a;padding:20px 24px;">
<p style="margin:0;color:#34d399;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Tread Trails</p>
</td></tr>
<tr><td style="padding:24px;color:#374151;line-height:1.6;font-size:15px;">${body}</td></tr>
<tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
Expedition-grade upgrades · Bengaluru · Mumbai · Dubai
</td></tr>
</table>
</body></html>`;
}

export function buildLeadEmail(
  template: LeadEmailTemplateId,
  ctx: LeadEmailContext
): { subject: string; html: string; preview: string } {
  const name = escapeHtml(ctx.firstName.trim() || "there");
  const company = ctx.companyName
    ? ` at ${escapeHtml(ctx.companyName)}`
    : "";

  switch (template) {
    case "follow_up":
      return {
        subject: "Following up on your Tread Trails inquiry",
        preview: `Hi ${ctx.firstName}, following up on your message.`,
        html: wrap(
          `<p>Hi ${name},</p>
           <p>Thank you for reaching out to Tread Trails. I wanted to follow up on your inquiry${company} and see if you had any questions about fitment, lead times, or studio availability.</p>
           <p>Reply to this email or message us on WhatsApp — we are happy to spec the right kit for your platform.</p>
           <p>— Tread Trails Concierge</p>`
        ),
      };
    case "qualified_next_steps":
      return {
        subject: "Next steps for your Tread Trails build",
        preview: "Your inquiry is qualified — here are next steps.",
        html: wrap(
          `<p>Hi ${name},</p>
           <p>Great news — we have reviewed your requirements${company} and our expedition engineers are ready to move forward with a tailored proposal.</p>
           <p>We can schedule a bay consultation or share a formal quote. Let us know your preferred timeline.</p>
           <p>— Tread Trails Partnerships</p>`
        ),
      };
    case "thank_you":
      return {
        subject: "Thank you for choosing Tread Trails",
        preview: "Thank you for your business.",
        html: wrap(
          `<p>Hi ${name},</p>
           <p>Thank you for trusting Tread Trails with your build. Our fulfilment and studio teams are here if you need anything post-purchase.</p>
           <p>— Tread Trails</p>`
        ),
      };
    case "interest":
    default:
      return {
        subject: "We received your inquiry — Tread Trails",
        preview: `Hi ${ctx.firstName}, we received your inquiry.`,
        html: wrap(
          `<p>Hi ${name},</p>
           <p>We received your message${ctx.subject ? ` regarding <strong>${escapeHtml(ctx.subject)}</strong>` : ""} and our team will respond shortly.</p>
           <p>For urgent fitment questions, reply to this email or reach us on WhatsApp.</p>
           <p>— Tread Trails</p>`
        ),
      };
  }
}
