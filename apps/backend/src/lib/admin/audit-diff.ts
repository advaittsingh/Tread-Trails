export function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function extractChange(
  prev: Record<string, unknown>,
  patch: Record<string, unknown>
): { previousValue: Record<string, unknown>; newValue: Record<string, unknown> } | null {
  const previousValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};
  let hasChange = false;

  for (const key of Object.keys(patch)) {
    if (!(key in patch)) continue;
    const before = prev[key];
    const after = patch[key];
    if (!jsonEqual(before, after)) {
      previousValue[key] = before ?? null;
      newValue[key] = after ?? null;
      hasChange = true;
    }
  }

  return hasChange ? { previousValue, newValue } : null;
}

export function pickFields(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
}

export function toAuditRecord(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value !== "object") return { value };
  if (Array.isArray(value)) return { items: value };
  return value as Record<string, unknown>;
}
