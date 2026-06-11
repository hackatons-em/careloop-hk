// Calendar-date helpers for ISO date strings (YYYY-MM-DD). UTC-based math so
// results are stable regardless of server timezone.

import { WEEK_END } from "./seed";

/**
 * Today's clinical date. In DEMO_MODE the clock is frozen to the demo week's
 * last day so the seeded scenario stays coherent; otherwise it is the real
 * calendar date in the configured timezone (Hong Kong by default).
 */
export function todayISO(): string {
  if (process.env.DEMO_MODE === "true") return WEEK_END;
  return new Date().toLocaleDateString("en-CA", {
    timeZone: process.env.CARELOOP_TZ ?? "Asia/Hong_Kong",
  });
}

function parse(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

/** Whole-day difference b - a (e.g. diffDays("2026-06-05","2026-06-06") === 1). */
export function diffDays(aIso: string, bIso: string): number {
  return Math.round((parse(bIso) - parse(aIso)) / 86_400_000);
}

/** Add (or subtract) whole days to an ISO date, returning YYYY-MM-DD. */
export function addDays(iso: string, delta: number): string {
  return new Date(parse(iso) + delta * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The exact UTC instant of local midnight for a calendar date in a timezone,
 * as an ISO string. Used to query timestamptz columns by a local-day window:
 * a naive `${date}T00:00:00` literal is interpreted in the DB session zone
 * (UTC on Supabase), which is 8h off for Hong Kong. Derives the zone offset
 * from the date itself (via Intl.formatToParts, so the host machine's own
 * timezone never leaks in), so it stays correct across DST for any tz.
 */
/**
 * Default follow-up due instant: 18:00 today in the clinical timezone, or
 * 09:00 tomorrow if it is already ≥18:00 there — so a task never starts life
 * overdue. Computed in CARELOOP_TZ (not the caller's zone), so the server owns
 * the wall-clock instead of trusting a browser's local time.
 */
export function followUpDueISO(timeZone = process.env.CARELOOP_TZ ?? "Asia/Hong_Kong"): string {
  // Current wall-clock hour + date in the target zone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const localDate = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number(get("hour"));
  const midnight = localMidnightUtcISO(localDate, timeZone);
  const base = Date.parse(midnight);
  // 18:00 today, else 09:00 the next local day.
  return hour >= 18
    ? new Date(base + 33 * 3_600_000).toISOString() // +24h + 9h
    : new Date(base + 18 * 3_600_000).toISOString();
}

export function localMidnightUtcISO(isoDate: string, timeZone: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  // T0 = midnight-UTC of the target date. We want M, the instant whose
  // wall-clock in `timeZone` is midnight of that date; with zone offset O
  // (ms east of UTC), M = T0 - O.
  const t0 = Date.UTC(y, (m || 1) - 1, d || 1);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(t0));
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  // The zone's wall-clock at instant t0, reinterpreted as if it were UTC.
  const asUtc = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  const offset = asUtc - t0; // O
  return new Date(t0 - offset).toISOString();
}
