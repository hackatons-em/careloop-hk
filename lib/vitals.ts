// Helpers to pivot long-format VitalReading[] into per-day rows for charts
// and the risk engine. Shared by the risk engine (core) and timeline API.

import type { DailyVitals, VitalReading, VitalType } from "./types";

const FIELD_BY_TYPE: Record<VitalType, keyof Omit<DailyVitals, "date">> = {
  weight: "weight",
  blood_pressure_systolic: "systolic",
  blood_pressure_diastolic: "diastolic",
  heart_rate: "heart_rate",
  steps: "steps",
  sleep_hours: "sleep_hours",
};

/** Date portion (YYYY-MM-DD) of an ISO timestamp. */
export function dayOf(timestamp: string): string {
  return timestamp.slice(0, 10);
}

/** Group long-format readings into one row per day, sorted oldest → newest. */
export function toDailyVitals(vitals: VitalReading[]): DailyVitals[] {
  const byDate = new Map<string, DailyVitals>();
  for (const v of vitals) {
    const date = dayOf(v.timestamp);
    let row = byDate.get(date);
    if (!row) {
      row = {
        date,
        weight: null,
        systolic: null,
        diastolic: null,
        heart_rate: null,
        steps: null,
        sleep_hours: null,
      };
      byDate.set(date, row);
    }
    row[FIELD_BY_TYPE[v.type]] = v.value;
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Last non-null value of a daily field. */
export function latest(
  daily: DailyVitals[],
  key: keyof Omit<DailyVitals, "date">,
): number | null {
  for (let i = daily.length - 1; i >= 0; i--) {
    const value = daily[i][key];
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

/** Trailing series of a field with nulls removed (oldest → newest). */
export function series(
  daily: DailyVitals[],
  key: keyof Omit<DailyVitals, "date">,
): { date: string; value: number }[] {
  return daily
    .filter((d) => d[key] !== null && d[key] !== undefined)
    .map((d) => ({ date: d.date, value: d[key] as number }));
}
