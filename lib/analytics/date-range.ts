export type AnalyticsDateRange = {
  from: string;
  to: string;
  start: Date;
  endExclusive: Date;
  dayKeys: string[];
  label: string;
};

const MAX_RANGE_DAYS = 366;

function dayKeyUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addUtcDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function dayKeysBetween(start: Date, endInclusive: Date): string[] {
  const keys: string[] = [];
  let cursor = new Date(start);
  const end = new Date(endInclusive);
  while (cursor <= end) {
    keys.push(dayKeyUtc(cursor));
    cursor = addUtcDays(cursor, 1);
  }
  return keys;
}

export function parseAnalyticsDateRange(
  searchParams: URLSearchParams
): AnalyticsDateRange | { error: string } {
  const fromParam = searchParams.get("from")?.trim();
  const toParam = searchParams.get("to")?.trim();

  let start: Date;
  let endInclusive: Date;

  if (fromParam && toParam) {
    const from = parseYmd(fromParam);
    const to = parseYmd(toParam);
    if (!from || !to) {
      return { error: "Invalid from/to — use YYYY-MM-DD." };
    }
    if (from > to) {
      return { error: "from must be on or before to." };
    }
    start = from;
    endInclusive = to;
  } else {
    const raw = Number(searchParams.get("days"));
    const days = [7, 30, 90, 180, 365].includes(raw) ? raw : 30;
    endInclusive = new Date();
    endInclusive.setUTCHours(0, 0, 0, 0);
    start = addUtcDays(endInclusive, -(days - 1));
  }

  const dayKeys = dayKeysBetween(start, endInclusive);
  if (dayKeys.length > MAX_RANGE_DAYS) {
    return { error: `Date range exceeds ${MAX_RANGE_DAYS} days.` };
  }

  const endExclusive = addUtcDays(endInclusive, 1);

  return {
    from: dayKeys[0]!,
    to: dayKeys[dayKeys.length - 1]!,
    start,
    endExclusive,
    dayKeys,
    label:
      fromParam && toParam
        ? `${dayKeys[0]} → ${dayKeys[dayKeys.length - 1]}`
        : `Last ${dayKeys.length} days`,
  };
}

export function fillDailySeries<T extends { date: string }>(
  dayKeys: string[],
  rows: T[],
  defaults: Omit<T, "date">
): T[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  return dayKeys.map((date) => {
    const hit = byDate.get(date);
    return hit ?? ({ date, ...defaults } as T);
  });
}
