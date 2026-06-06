// Calendar-date helpers for ISO date strings (YYYY-MM-DD). UTC-based math so
// results are stable regardless of server timezone.

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
