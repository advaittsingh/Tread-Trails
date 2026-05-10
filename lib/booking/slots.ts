/**
 * Studio scheduling: allowed windows, closed weekdays, and slot validation.
 * Wall times use a configurable studio timezone + fixed UTC offset (regions without DST).
 * Optional env overrides: server `BOOKING_STUDIO_*`, browser `NEXT_PUBLIC_BOOKING_STUDIO_*`.
 */

export const BOOKING_TIME_SLOTS = ["09:30", "11:00", "13:30", "15:30", "17:00"] as const;
export type BookingTimeSlot = (typeof BOOKING_TIME_SLOTS)[number];

export const BOOKING_STUDIO_TIMEZONE_DEFAULT = "Asia/Kolkata";

/** 0 = Sunday … 6 = Saturday — studio closed these days */
export const BOOKING_CLOSED_WEEKDAYS: readonly number[] = [0];

/** Max days ahead (inclusive of today) */
export const BOOKING_MAX_ADVANCE_DAYS = 120;

/** Same-day bookings must start at least this many minutes from now */
export const BOOKING_SOON_BUFFER_MINUTES = 45;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * UTC offset minutes east of UTC for studio civil time (no DST).
 * If `BOOKING_STUDIO_UTC_OFFSET_MINUTES` / `NEXT_PUBLIC_BOOKING_STUDIO_UTC_OFFSET_MINUTES`
 * is unset and an IANA id is missing here, offsets fall back to Kolkata (+330).
 */
export const STUDIO_OFFSET_MINUTES_BY_IANA: Record<string, number> = {
  [BOOKING_STUDIO_TIMEZONE_DEFAULT]: 330,
  "Asia/Dubai": 240,
  "Asia/Karachi": 300,
  "Asia/Dhaka": 360,
  "Asia/Yangon": 390,
  "Asia/Bangkok": 420,
  "Asia/Jakarta": 420,
  "Asia/Singapore": 480,
  "Asia/Shanghai": 480,
  "Asia/Hong_Kong": 480,
  "Asia/Taipei": 480,
  "Asia/Tokyo": 540,
  "Asia/Seoul": 540,
  "Australia/Perth": 480,
  "Asia/Kathmandu": 345,
  "Asia/Colombo": 330,
};

export type BookingClockContext = {
  /** IANA zone label for UI / docs */
  timeZone: string;
  /** Fixed offset east of UTC in minutes */
  utcOffsetMinutes: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseOffsetMinutesEnv(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function resolveUtcOffsetMinutes(timeZone: string, explicit?: number): number {
  if (explicit !== undefined) return explicit;
  const mapped = STUDIO_OFFSET_MINUTES_BY_IANA[timeZone];
  if (mapped !== undefined) return mapped;
  return STUDIO_OFFSET_MINUTES_BY_IANA[BOOKING_STUDIO_TIMEZONE_DEFAULT];
}

/** Server / API routes — uses BOOKING_STUDIO_TIMEZONE + BOOKING_STUDIO_UTC_OFFSET_MINUTES */
export function bookingStudioClockContextServer(): BookingClockContext {
  const timeZone = process.env.BOOKING_STUDIO_TIMEZONE ?? BOOKING_STUDIO_TIMEZONE_DEFAULT;
  const explicit = parseOffsetMinutesEnv(process.env.BOOKING_STUDIO_UTC_OFFSET_MINUTES);
  const utcOffsetMinutes = resolveUtcOffsetMinutes(timeZone, explicit);
  return { timeZone, utcOffsetMinutes };
}

/**
 * Client components — uses NEXT_PUBLIC_BOOKING_STUDIO_TIMEZONE + NEXT_PUBLIC_BOOKING_STUDIO_UTC_OFFSET_MINUTES.
 * Set these to mirror server vars so SSR and `/api/bookings` agree.
 */
export function bookingStudioClockContextClient(): BookingClockContext {
  const timeZone =
    process.env.NEXT_PUBLIC_BOOKING_STUDIO_TIMEZONE ?? BOOKING_STUDIO_TIMEZONE_DEFAULT;
  const explicit = parseOffsetMinutesEnv(process.env.NEXT_PUBLIC_BOOKING_STUDIO_UTC_OFFSET_MINUTES);
  const utcOffsetMinutes = resolveUtcOffsetMinutes(timeZone, explicit);
  return { timeZone, utcOffsetMinutes };
}

/** Weekday for YYYY-MM-DD (calendar date, TZ-independent). */
export function civilWeekdayFromISODate(dateStr: string): number | null {
  const m = dateStr.match(ISO_DATE_RE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** Today's calendar date in studio civil time (YYYY-MM-DD). */
export function studioCalendarTodayISO(now: Date, utcOffsetMinutes: number): string {
  const shifted = new Date(now.getTime() + utcOffsetMinutes * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const mo = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  return `${y}-${pad2(mo)}-${pad2(day)}`;
}

export function addDaysToISODate(isoDate: string, days: number): string {
  const m = isoDate.match(ISO_DATE_RE);
  if (!m) return isoDate;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d) + days * 86_400_000;
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** Instant (UTC ms) when studio wall clock reads dateStr at hh:mm. */
export function studioSlotInstantMs(
  dateStr: string,
  hhmm: string,
  utcOffsetMinutes: number
): number | null {
  const m = dateStr.match(ISO_DATE_RE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const parts = hhmm.split(":");
  const h = Number(parts[0]);
  const mi = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(mi)) return null;
  return Date.UTC(y, mo - 1, d, h, mi, 0, 0) - utcOffsetMinutes * 60 * 1000;
}

export function isAllowedBookingTime(t: string): t is BookingTimeSlot {
  return (BOOKING_TIME_SLOTS as readonly string[]).includes(t);
}

export function isBookingDateClosed(dateStr: string): boolean {
  const wd = civilWeekdayFromISODate(dateStr);
  if (wd === null) return true;
  return BOOKING_CLOSED_WEEKDAYS.includes(wd);
}

export function isBookingDateBeyondHorizon(
  dateStr: string,
  todayISO: string,
  maxAdvanceDays: number = BOOKING_MAX_ADVANCE_DAYS
): boolean {
  const limit = addDaysToISODate(todayISO, maxAdvanceDays);
  return dateStr > limit;
}

export type BookingSlotIssue =
  | "invalid_date"
  | "invalid_time"
  | "closed_day"
  | "past"
  | "too_far";

export function validateBookingSlot(
  dateStr: string,
  timeHHMM: string,
  opts?: {
    now?: Date;
    utcOffsetMinutes: number;
    bufferMinutes?: number;
  }
): BookingSlotIssue | null {
  const now = opts?.now ?? new Date();
  const utcOff =
    opts?.utcOffsetMinutes ?? STUDIO_OFFSET_MINUTES_BY_IANA[BOOKING_STUDIO_TIMEZONE_DEFAULT];
  const buffer = opts?.bufferMinutes ?? BOOKING_SOON_BUFFER_MINUTES;

  if (!ISO_DATE_RE.test(dateStr)) return "invalid_date";
  if (!isAllowedBookingTime(timeHHMM)) return "invalid_time";
  if (isBookingDateClosed(dateStr)) return "closed_day";

  const today = studioCalendarTodayISO(now, utcOff);
  if (dateStr < today) return "past";

  if (isBookingDateBeyondHorizon(dateStr, today)) return "too_far";

  const ms = studioSlotInstantMs(dateStr, timeHHMM, utcOff);
  if (ms === null) return "invalid_date";

  if (ms < now.getTime() + buffer * 60 * 1000) return "past";

  return null;
}

export function bookingSlotErrorMessage(issue: BookingSlotIssue): string {
  switch (issue) {
    case "invalid_date":
      return "Choose a valid date.";
    case "invalid_time":
      return "Pick one of the listed time windows.";
    case "closed_day":
      return "We are closed that day — choose another date.";
    case "past":
      return "That slot is no longer available — pick a future date or time.";
    case "too_far":
      return `Book within the next ${BOOKING_MAX_ADVANCE_DAYS} days.`;
    default:
      return "Invalid slot.";
  }
}

/** Last inclusive calendar day shown in the date picker. */
export function bookingSelectableMaxISO(now: Date, utcOffsetMinutes: number): string {
  const today = studioCalendarTodayISO(now, utcOffsetMinutes);
  return addDaysToISODate(today, BOOKING_MAX_ADVANCE_DAYS);
}

/** 24h HH:mm → readable label (studio-local convention). */
export function formatBookingSlotLabel(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${period}`;
}

export function isBookingSlotDisabled(
  dateStr: string,
  slot: string,
  opts?: { now?: Date; utcOffsetMinutes: number; bufferMinutes?: number }
): boolean {
  return validateBookingSlot(dateStr, slot, opts) !== null;
}
