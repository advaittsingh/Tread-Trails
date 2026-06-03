import type { LogSeverity } from "@/lib/logger/types";

export type ForwardPayload = {
  severity: LogSeverity;
  category: string;
  message: string;
  route?: string;
  userId?: string;
  stack?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

function severityToSentryLevel(
  severity: LogSeverity
): "debug" | "info" | "warning" | "error" | "fatal" {
  if (severity === "warn") return "warning";
  if (severity === "fatal") return "fatal";
  if (severity === "debug") return "debug";
  if (severity === "info") return "info";
  return "error";
}

function parseSentryDsn(dsn: string): { storeUrl: string; key: string } | null {
  try {
    const u = new URL(dsn);
    const key = u.username;
    const projectId = u.pathname.replace(/^\//, "");
    if (!key || !projectId) return null;
    return {
      storeUrl: `https://${u.host}/api/${projectId}/store/`,
      key,
    };
  } catch {
    return null;
  }
}

export async function forwardToSentry(payload: ForwardPayload): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  const body = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: payload.timestamp,
    platform: "node",
    level: severityToSentryLevel(payload.severity),
    logger: "tread-trails",
    tags: {
      category: payload.category,
      route: payload.route ?? "unknown",
    },
    user: payload.userId ? { id: payload.userId } : undefined,
    exception: payload.stack
      ? {
          values: [
            {
              type: payload.category,
              value: payload.message,
              stacktrace: { frames: [{ filename: payload.route }] },
            },
          ],
        }
      : undefined,
    message: payload.stack ? undefined : { formatted: payload.message },
    extra: payload.meta,
  };

  try {
    await fetch(parsed.storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.key}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    /* non-blocking */
  }
}

export async function forwardToBetterStack(
  payload: ForwardPayload
): Promise<void> {
  const token = process.env.BETTERSTACK_SOURCE_TOKEN?.trim();
  if (!token) return;

  const level =
    payload.severity === "warn"
      ? "warn"
      : payload.severity === "fatal"
        ? "critical"
        : payload.severity;

  try {
    await fetch("https://in.logs.betterstack.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: payload.message,
        level,
        dt: payload.timestamp,
        category: payload.category,
        route: payload.route,
        user_id: payload.userId,
        stack: payload.stack,
        ...payload.meta,
      }),
    });
  } catch {
    /* non-blocking */
  }
}
