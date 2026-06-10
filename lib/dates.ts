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
