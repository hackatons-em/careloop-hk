// Small, locale-stable date formatters. We format directly from ISO strings to
// avoid timezone drift from `new Date("YYYY-MM-DD")` (parsed as UTC midnight).
// Locale-aware: "en" (default) → "6 Jun"; "zh-HK" → "6月6日". Client components
// should use lib/useFormat.ts, which binds the active locale automatically.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type FormatLocale = "en" | "zh-HK";

function parts(iso: string | null | undefined): [number, number, number] | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return [y, m, d];
}

/** "2026-06-06" → en "6 Jun" · zh-HK "6月6日" */
export function formatDay(iso: string | null | undefined, locale: FormatLocale = "en"): string {
  const p = parts(iso);
  if (!p) return "—";
  const [, m, d] = p;
  return locale === "zh-HK" ? `${m}月${d}日` : `${d} ${MONTHS[m - 1]}`;
}

/** "2026-06-06" → en "6 Jun 2026" · zh-HK "2026年6月6日" */
export function formatDayYear(
  iso: string | null | undefined,
  locale: FormatLocale = "en",
): string {
  const p = parts(iso);
  if (!p) return "—";
  const [y, m, d] = p;
  return locale === "zh-HK" ? `${y}年${m}月${d}日` : `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Just the day-of-month number ("6") — locale-independent. Use this instead
 * of string-splitting formatDay output (which is locale-shaped). */
export function formatDayNumber(iso: string | null | undefined): string {
  const p = parts(iso);
  if (!p) return "—";
  return String(p[2]);
}

/** ISO datetime → en "6 Jun, 09:00" · zh-HK "6月6日 09:00" (UTC time-of-day
 * from the stored stamp). */
export function formatDateTime(
  iso: string | null | undefined,
  locale: FormatLocale = "en",
): string {
  if (!iso) return "—";
  const day = formatDay(iso, locale);
  const t = iso.slice(11, 16);
  if (!t) return day;
  return locale === "zh-HK" ? `${day} ${t}` : `${day}, ${t}`;
}
