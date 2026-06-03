import { logger, type LogCategory } from "@/lib/logger";

/** @deprecated Prefer `logger.error` — kept for existing call sites. */
export async function logAppError(opts: {
  source: string;
  message: string;
  detail?: string;
  meta?: Record<string, unknown>;
  route?: string;
  userId?: string;
  severity?: "warn" | "error" | "fatal";
  error?: unknown;
}): Promise<void> {
  const category = mapSourceToCategory(opts.source);
  const severity = opts.severity ?? "error";
  await logger[severity === "warn" ? "warn" : severity === "fatal" ? "fatal" : "error"](
    opts.message,
    {
      category,
      source: opts.source,
      route: opts.route,
      userId: opts.userId,
      error: opts.error,
      meta: {
        ...opts.meta,
        ...(opts.detail ? { detail: opts.detail } : {}),
      },
    }
  );
}

function mapSourceToCategory(source: string): LogCategory {
  if (source.includes("auth") || source.includes("login")) return "auth";
  if (
    source.includes("stripe") ||
    source.includes("razorpay") ||
    source.includes("juspay") ||
    source.includes("payment")
  ) {
    return "payment";
  }
  if (source.includes("booking")) return "booking";
  if (source.includes("webhook")) return "webhook";
  if (source.includes("contact") || source.includes("email")) return "email";
  return "api";
}
