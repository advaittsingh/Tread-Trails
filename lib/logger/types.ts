export type LogSeverity = "debug" | "info" | "warn" | "error" | "fatal";

export type LogCategory =
  | "api"
  | "auth"
  | "payment"
  | "booking"
  | "webhook"
  | "email"
  | "system";

export type LogEntry = {
  severity: LogSeverity;
  category: LogCategory;
  message: string;
  source?: string;
  route?: string;
  userId?: string;
  error?: unknown;
  meta?: Record<string, unknown>;
  persist?: boolean;
};

export type StructuredLogLine = {
  ts: string;
  severity: LogSeverity;
  category: LogCategory;
  message: string;
  route?: string;
  userId?: string;
  meta?: Record<string, unknown>;
};
