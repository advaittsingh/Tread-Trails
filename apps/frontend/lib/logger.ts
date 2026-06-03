import { forwardToBetterStack, forwardToSentry } from "@/lib/logger/forwarders";
import { redactMeta } from "@/lib/logger/redact";
import type {
  LogCategory,
  LogEntry,
  LogSeverity,
  StructuredLogLine,
} from "@/lib/logger/types";

export type { LogCategory, LogEntry, LogSeverity, StructuredLogLine };

const SEVERITY_ORDER: Record<LogSeverity, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

function shouldPersist(severity: LogSeverity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER.warn;
}

function extractStack(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) {
    return error.stack.slice(0, 12_000);
  }
  return undefined;
}

function formatConsoleLine(line: StructuredLogLine): string {
  const parts = [
    line.ts,
    line.severity.toUpperCase(),
    `[${line.category}]`,
    line.route ? `${line.route}` : "",
    line.message,
  ].filter(Boolean);
  return parts.join(" ");
}

async function persistLog(entry: LogEntry, stack?: string): Promise<void> {
  if (!shouldPersist(entry.severity) && entry.persist !== true) return;

  const safeMeta = redactMeta(entry.meta);
  const source = entry.source ?? entry.category;

  try {
    // Phase 5: storefront no longer writes logs to DB.
    void source;
    void stack;
    void safeMeta;
  } catch (e) {
    console.error("[logger] persist failed", e);
  }
}

async function emit(entry: LogEntry): Promise<void> {
  const stack = extractStack(entry.error);
  const safeMeta = redactMeta(entry.meta);
  const ts = new Date().toISOString();

  const line: StructuredLogLine = {
    ts,
    severity: entry.severity,
    category: entry.category,
    message: entry.message,
    route: entry.route,
    userId: entry.userId,
    meta: safeMeta,
  };

  const consoleFn =
    entry.severity === "fatal" || entry.severity === "error"
      ? console.error
      : entry.severity === "warn"
        ? console.warn
        : console.info;

  consoleFn(formatConsoleLine(line), safeMeta ?? "");
  if (stack && entry.severity !== "debug") {
    consoleFn(stack);
  }

  const forwardPayload = {
    severity: entry.severity,
    category: entry.category,
    message: entry.message,
    route: entry.route,
    userId: entry.userId,
    stack,
    timestamp: ts,
    meta: safeMeta,
  };

  if (SEVERITY_ORDER[entry.severity] >= SEVERITY_ORDER.warn) {
    void Promise.all([
      persistLog(entry, stack),
      forwardToSentry(forwardPayload),
      forwardToBetterStack(forwardPayload),
    ]);
  }
}

function base(
  severity: LogSeverity,
  category: LogCategory,
  message: string,
  ctx?: Omit<LogEntry, "severity" | "category" | "message">
): Promise<void> {
  return emit({
    severity,
    category,
    message,
    ...ctx,
  });
}

export const logger = {
  debug: (message: string, ctx?: Omit<LogEntry, "severity" | "message">) =>
    base("debug", ctx?.category ?? "api", message, ctx),

  info: (message: string, ctx?: Omit<LogEntry, "severity" | "message">) =>
    base("info", ctx?.category ?? "api", message, ctx),

  warn: (message: string, ctx?: Omit<LogEntry, "severity" | "message">) =>
    base("warn", ctx?.category ?? "api", message, ctx),

  error: (message: string, ctx?: Omit<LogEntry, "severity" | "message">) =>
    base("error", ctx?.category ?? "api", message, ctx),

  fatal: (message: string, ctx?: Omit<LogEntry, "severity" | "message">) =>
    base("fatal", ctx?.category ?? "api", message, { ...ctx, persist: true }),
};

/** Resolve API path from a Request (no query string). */
export function routeFromRequest(req: Request): string {
  try {
    return new URL(req.url).pathname;
  } catch {
    return "unknown";
  }
}

export async function logApiFailure(
  req: Request,
  message: string,
  error?: unknown,
  meta?: Record<string, unknown>
): Promise<void> {
  await logger.error(message, {
    category: "api",
    route: routeFromRequest(req),
    error,
    meta,
  });
}

export async function logAuthFailure(
  req: Request,
  message: string,
  opts?: { userId?: string; error?: unknown; severity?: LogSeverity; meta?: Record<string, unknown> }
): Promise<void> {
  const severity = opts?.severity ?? "warn";
  await base(severity, "auth", message, {
    route: routeFromRequest(req),
    userId: opts?.userId,
    error: opts?.error,
    meta: opts?.meta,
    source: "auth",
  });
}

export async function logPaymentFailure(
  req: Request,
  message: string,
  opts?: {
    userId?: string;
    error?: unknown;
    provider?: string;
    orderId?: string;
    severity?: LogSeverity;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  const severity = opts?.severity ?? "error";
  await base(severity, "payment", message, {
    route: routeFromRequest(req),
    userId: opts?.userId,
    error: opts?.error,
    source: opts?.provider ?? "payment",
    meta: {
      provider: opts?.provider,
      orderId: opts?.orderId,
      ...opts?.meta,
    },
  });
}

export async function logBookingFailure(
  req: Request,
  message: string,
  opts?: { userId?: string; error?: unknown; meta?: Record<string, unknown> }
): Promise<void> {
  await logger.error(message, {
    category: "booking",
    route: routeFromRequest(req),
    userId: opts?.userId,
    error: opts?.error,
    source: "booking",
    meta: opts?.meta,
  });
}

export async function logWebhookFailure(
  route: string,
  message: string,
  error?: unknown,
  meta?: Record<string, unknown>
): Promise<void> {
  await logger.error(message, {
    category: "webhook",
    route,
    error,
    source: "webhook",
    meta,
  });
}
