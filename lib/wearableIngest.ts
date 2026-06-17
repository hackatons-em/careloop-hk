// Pure normalization of Terra webhook payloads → (raw intraday samples) +
// (per-day rollup for the existing daily vitals/risk engine). No I/O here so it
// is fully unit-testable; the store layer performs the DB writes.
//
// Terra payloads are large and nested; every access is defensive (best-effort
// extraction). Unknown shapes simply yield fewer samples, never throw.

import type { VitalType } from "./types";
import { VITAL_RANGES } from "./validation";

/** A raw intraday sample (free-form type). */
export interface NormalizedSample {
  type: string;
  ts: string; // ISO
  value: number;
  unit: string;
}

/** A per-day rollup row mapped onto the existing daily VitalType set. */
export interface RollupRow {
  date: string; // YYYY-MM-DD
  type: VitalType;
  value: number;
  unit: string;
}

export interface NormalizedPayload {
  samples: NormalizedSample[];
  rollup: RollupRow[];
}

// Plausibility bounds for sample types beyond the daily VitalType set.
const SAMPLE_RANGES: Record<string, { min: number; max: number }> = {
  heart_rate: VITAL_RANGES.heart_rate,
  resting_heart_rate: VITAL_RANGES.heart_rate,
  steps: VITAL_RANGES.steps,
  blood_pressure_systolic: VITAL_RANGES.blood_pressure_systolic,
  blood_pressure_diastolic: VITAL_RANGES.blood_pressure_diastolic,
  spo2: { min: 50, max: 100 },
  hrv: { min: 0, max: 500 },
};

const UNIT: Record<string, string> = {
  heart_rate: "bpm",
  resting_heart_rate: "bpm",
  steps: "steps",
  spo2: "%",
  hrv: "ms",
  blood_pressure_systolic: "mmHg",
  blood_pressure_diastolic: "mmHg",
  weight: "kg",
  sleep_hours: "h",
};

const MAX_SAMPLES = 5000; // guard against pathological payloads

function num(x: unknown): number | null {
  const n = typeof x === "string" ? Number(x) : (x as number);
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function inRange(type: string, value: number): boolean {
  const r = SAMPLE_RANGES[type];
  if (!r) return true;
  return value >= r.min && value <= r.max;
}

function isoOf(x: unknown): string | null {
  if (typeof x !== "string" || x.length < 10) return null;
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

function asArray(x: unknown): unknown[] {
  return Array.isArray(x) ? x : [];
}

function get(obj: unknown, key: string): unknown {
  return obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined;
}

// --- per-record extractors --------------------------------------------------

function pushSample(out: NormalizedSample[], type: string, ts: string | null, value: number | null) {
  if (out.length >= MAX_SAMPLES) return;
  if (ts === null || value === null) return;
  if (!inRange(type, value)) return;
  out.push({ type, ts, value, unit: UNIT[type] ?? "" });
}

function extractHeartRateSamples(rec: unknown, out: NormalizedSample[]) {
  const detailed = get(get(rec, "heart_rate_data"), "detailed");
  for (const s of asArray(get(detailed, "hr_samples"))) {
    pushSample(out, "heart_rate", isoOf(get(s, "timestamp")), num(get(s, "bpm")));
  }
}

function extractSpo2Samples(rec: unknown, out: NormalizedSample[]) {
  for (const s of asArray(get(get(rec, "oxygen_data"), "saturation_samples"))) {
    pushSample(out, "spo2", isoOf(get(s, "timestamp")), num(get(s, "percentage")));
  }
}

function extractStepSamples(rec: unknown, out: NormalizedSample[]) {
  const detailed = get(get(rec, "distance_data"), "detailed");
  for (const s of asArray(get(detailed, "step_samples"))) {
    pushSample(out, "steps", isoOf(get(s, "timestamp")), num(get(s, "steps")));
  }
}

function extractBpSamples(rec: unknown, out: NormalizedSample[]) {
  for (const s of asArray(get(get(rec, "blood_pressure_data"), "blood_pressure_samples"))) {
    const ts = isoOf(get(s, "timestamp"));
    pushSample(out, "blood_pressure_systolic", ts, num(get(s, "systolic_bp")));
    pushSample(out, "blood_pressure_diastolic", ts, num(get(s, "diastolic_bp")));
  }
}

// --- rollup helpers ---------------------------------------------------------

type RollupAcc = Map<string, RollupRow>; // key = `${date}|${type}`

function setRollup(acc: RollupAcc, date: string, type: VitalType, value: number | null, mode: "last" | "max") {
  if (value === null) return;
  const r = VITAL_RANGES[type];
  if (r && (value < r.min || value > r.max)) return;
  const key = `${date}|${type}`;
  const prev = acc.get(key);
  if (!prev) {
    acc.set(key, { date, type, value, unit: UNIT[type] ?? r?.unit ?? "" });
    return;
  }
  if (mode === "max" && value > prev.value) prev.value = value;
  else if (mode === "last") prev.value = value;
}

// --- public API -------------------------------------------------------------

/**
 * Normalize one Terra webhook payload's `data` array for a given event `type`
 * ("daily" | "body" | "sleep" | "activity"). Returns intraday samples + a daily
 * rollup mapped onto the existing VitalType set.
 */
export function normalizeTerraPayload(eventType: string, data: unknown[]): NormalizedPayload {
  const samples: NormalizedSample[] = [];
  const acc: RollupAcc = new Map();
  // Day → the highest-systolic BP reading seen so far, as a UNIT (so systolic and
  // diastolic always come from the same real sample). Emitted after the loop.
  const bpBest = new Map<string, { sys: number; dia: number | null }>();

  for (const rec of data) {
    // Day anchor: daily/activity use start_time; sleep is attributed to wake day (end_time).
    const meta = get(rec, "metadata");
    const startIso = isoOf(get(meta, "start_time"));
    const endIso = isoOf(get(meta, "end_time"));
    const recDay = eventType === "sleep" ? dayOf(endIso ?? startIso ?? "") : dayOf(startIso ?? endIso ?? "");

    // Samples (intraday) — applicable to all record kinds that carry them.
    extractHeartRateSamples(rec, samples);
    extractSpo2Samples(rec, samples);
    extractStepSamples(rec, samples);
    extractBpSamples(rec, samples);

    if (!recDay) continue; // can't roll up without a day anchor

    if (eventType === "daily") {
      const hr = get(rec, "heart_rate_data");
      const resting = num(get(get(hr, "summary"), "resting_hr_bpm"));
      const avg = num(get(get(hr, "summary"), "avg_hr_bpm"));
      setRollup(acc, recDay, "heart_rate", resting ?? avg, "last");
      setRollup(acc, recDay, "steps", num(get(get(rec, "distance_data"), "steps")), "max");
    } else if (eventType === "activity") {
      setRollup(acc, recDay, "steps", num(get(get(rec, "distance_data"), "steps")), "max");
    } else if (eventType === "sleep") {
      const seconds = num(get(get(get(rec, "sleep_durations_data"), "asleep"), "duration_asleep_state_seconds"));
      if (seconds !== null) setRollup(acc, recDay, "sleep_hours", Math.round((seconds / 3600) * 10) / 10, "last");
    } else if (eventType === "body") {
      for (const m of asArray(get(get(rec, "measurements_data"), "measurements"))) {
        const w = num(get(m, "weight_kg"));
        const mDay = dayOf(isoOf(get(m, "measurement_time")) ?? `${recDay}T00:00:00Z`);
        setRollup(acc, mDay, "weight", w, "last");
      }
      // Track the day's highest-systolic REAL reading as a unit (across all body
      // records). Emitted as a pair after the loop — never an independent
      // per-bound max nor a stale cross-sample diastolic, either of which would
      // fabricate a BP pair and could trip a false BP-001 escalation.
      const bpRange = VITAL_RANGES.blood_pressure_systolic;
      for (const s of asArray(get(get(rec, "blood_pressure_data"), "blood_pressure_samples"))) {
        const sDay = dayOf(isoOf(get(s, "timestamp")) ?? `${recDay}T00:00:00Z`);
        const sys = num(get(s, "systolic_bp"));
        const dia = num(get(s, "diastolic_bp"));
        if (sys === null || !sDay || sys < bpRange.min || sys > bpRange.max) continue;
        const prev = bpBest.get(sDay);
        if (!prev || sys > prev.sys) bpBest.set(sDay, { sys, dia });
      }
    }
  }

  // Emit the day's worst BP as a real pair — diastolic ONLY when the winning
  // systolic sample actually carried one (never a stale value from another reading).
  for (const [day, bp] of bpBest) {
    setRollup(acc, day, "blood_pressure_systolic", bp.sys, "last");
    if (bp.dia !== null) setRollup(acc, day, "blood_pressure_diastolic", bp.dia, "last");
  }

  return { samples, rollup: [...acc.values()] };
}
