import { Resend } from "resend";

export type EmailProvider = "resend" | "sendgrid";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; provider: EmailProvider; id?: string }
  | { ok: false; error: string };

function preferredProvider(): EmailProvider | null {
  const forced = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (forced === "sendgrid" && process.env.SENDGRID_API_KEY) return "sendgrid";
  if (forced === "resend" && process.env.RESEND_API_KEY) return "resend";
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  return null;
}

function fromAddress(): string | null {
  return (
    process.env.RESEND_FROM_EMAIL ??
    process.env.SENDGRID_FROM_EMAIL ??
    null
  );
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = fromAddress();
  if (!apiKey || !from) {
    return { ok: false, error: "Resend not configured (RESEND_API_KEY, RESEND_FROM_EMAIL)." };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, provider: "resend", id: data?.id };
}

async function sendViaSendGrid(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = fromAddress();
  if (!apiKey || !from) {
    return {
      ok: false,
      error: "SendGrid not configured (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL or RESEND_FROM_EMAIL).",
    };
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: input.to }] }],
      from: { email: from },
      subject: input.subject,
      content: [{ type: "text/html", value: input.html }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: text.slice(0, 200) || `SendGrid HTTP ${res.status}`,
    };
  }

  const messageId = res.headers.get("x-message-id") ?? undefined;
  return { ok: true, provider: "sendgrid", id: messageId };
}

/** Sends transactional HTML email via Resend (default) or SendGrid when configured. */
export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const provider = preferredProvider();
  if (!provider) {
    return {
      ok: false,
      error:
        "No email provider configured — set RESEND_API_KEY or SENDGRID_API_KEY plus a verified from address.",
    };
  }

  if (provider === "sendgrid") return sendViaSendGrid(input);
  return sendViaResend(input);
}

export function emailProviderLabel(): string {
  return preferredProvider() ?? "none";
}
