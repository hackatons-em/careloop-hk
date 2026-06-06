// Small, locale-stable date formatters. We format directly from ISO strings to
// avoid timezone drift from `new Date("YYYY-MM-DD")` (parsed as UTC midnight).

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-06-06" or "2026-06-06T09:00:00Z" → "6 Jun" */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return `${d} ${MONTHS[m - 1]}`;
}

/** "2026-06-06" → "6 Jun 2026" */
export function formatDayYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** ISO datetime → "6 Jun, 09:00" (UTC time-of-day from the stored stamp). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const day = formatDay(iso);
  const t = iso.slice(11, 16);
  return t ? `${day}, ${t}` : day;
}
